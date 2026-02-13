# Piko Code Patterns & Anti-Patterns

每个 section 展示 ❌ 反模式 和 ✅ 正确模式的对比。
示例来自 Piko 真实代码 + 参考项目最佳实践。

---

## 1. 页面自治 vs 代码散落 {#page-autonomy}

### ❌ 当前: 代码平铺，职责混在一起

```
frontend/
├── components/
│   ├── chat/              # chat 的组件
│   ├── home/              # home 的组件
│   └── profile/           # profile 的组件
├── hooks/
│   ├── usePageData.ts     # 通用万能 hook
│   └── useAuth.ts         # 通用 hook
├── services/
│   ├── chat.ts
│   └── profile.ts
└── types/
    ├── chat.ts
    └── profile.ts
```

**问题:** 页面的组件、hooks、types 分散在不同目录。改一个页面要翻 4 个目录。
无法一眼看出哪些代码属于哪个页面。

### ✅ 正确: 页面自包含

```
frontend/
├── pages/
│   ├── chat/
│   │   ├── components/    # Chat 的组件全在这
│   │   ├── hooks/         # Chat 的 hooks 全在这
│   │   ├── types/         # Chat 的类型全在这
│   │   └── consts/
│   └── profile/
│       ├── components/
│       ├── hooks/
│       └── types/
├── common/
│   ├── components/        # 真正跨页面共享的
│   ├── hooks/             # 真正通用的 hooks
│   └── typings/           # 共享类型
└── service/               # 数据获取层
    ├── chat.ts
    └── profile.ts
```

**优势:** 删除一个页面 = 删除一个目录。页面间零耦合。

---

## 2. Hook: 分类清晰 vs 万能 Hook {#hook-taxonomy}

### ❌ 当前: 一个 hook 混合所有关注点

```typescript
// hooks/usePageData.ts — 当前代码 (74行, 2个 useEffect)
export default function usePageData<T>(fetcher, deps, options) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // ← string，信息丢失

  const silentLoad = useCallback(async () => {
    const result = await fetcherRef.current(); // ← 无 catch，崩溃风险
    setData(result);
  }, []);

  useEffect(() => {
    /* 加载 */
  }, deps); // ← Effect 1: 数据获取
  useEffect(() => {
    /* 轮询 */
  }, [interval]); // ← Effect 2: 轮询

  const refresh = useCallback(async () => {
    setLoading(true); // ← 竞态: unmount 后 setState
    await load();
    setLoading(false);
  }, [load]);

  return { data, loading, error, refresh, silentRefresh, setData };
}
```

**问题清单:**

1. 2 个 useEffect 混合不同关注点
2. `silentLoad` 无 catch
3. `error` 是 string，丢失错误分类
4. `deps: unknown[]` 绕过 exhaustive-deps
5. `refresh` 中 `setLoading` 有竞态
6. 万能泛型，每个页面的错误处理逻辑无法定制

### ✅ 正确: 三类 Hook 各司其职

```typescript
// ① 数据 Hook — pages/profile/hooks/useFetchData.ts
interface UseFetchDataResult {
  isLoading: boolean;
  errorType?: PageErrorType; // ← enum，不是 string
  data?: ProfilePageData;
  handleRetry: () => void; // ← void，不是 Promise<void>
}

const useFetchData = (session: string | null): UseFetchDataResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<PageErrorType>();
  const [data, setData] = useState<ProfilePageData>();

  const fetcher = async (): Promise<void> => {
    setIsLoading(true);
    setErrorType(undefined);
    try {
      const response = await fetchProfilePage(session ?? undefined);
      const error = getPageErrorType(response); // ← 纯函数映射错误
      if (error) {
        setErrorType(error);
        return;
      }
      setData(response.data);
    } catch {
      setErrorType(PageErrorType.NETWORK);
    } finally {
      setIsLoading(false); // ← finally 保证执行
    }
  };

  useEffect(() => {
    void fetcher(); // ← void 标记 fire-and-forget
  }, [session]);

  const handleRetry = (): void => {
    void fetcher();
  };

  return { isLoading, errorType, data, handleRetry };
};
```

```typescript
// ② 副作用 Hook — pages/chat/hooks/usePolling.ts
const usePolling = (
  callback: () => Promise<void>,
  intervalMs?: number,
): void => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback; // ← ref 保持最新

  useEffect(() => {
    // ← 只有 1 个 effect
    if (!intervalMs || intervalMs <= 0) return;
    const id = setInterval(() => {
      void callbackRef.current().catch((err: unknown) => {
        console.error('[usePolling]', err); // ← 静默操作也 catch
      });
    }, intervalMs);
    return () => clearInterval(id); // ← cleanup
  }, [intervalMs]);
};
```

```typescript
// ③ 派生 Hook — common/hooks/useFormattedTime.ts
export const useFormattedTime = (timestamp: number): string =>
  useMemo(() => {
    // ← 只有 useMemo，零副作用
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [timestamp]);
```

```typescript
// Screen 层组合:
const { isLoading, errorType, data, handleRetry } = useFetchData(session);
usePolling(silentRefresh, POLLING_INTERVAL);
```

---

## 3. 纯函数错误映射 vs 硬编码错误处理 {#error-mapping}

### ❌ 当前: 错误处理硬编码在 hook 中

```typescript
// 问题: 错误逻辑嵌入数据获取逻辑
const load = useCallback(async () => {
  try {
    setError('');
    const result = await fetcherRef.current();
    setData(result);
  } catch (err) {
    setError(err instanceof Error ? err.message : '加载失败'); // ← 硬编码
  }
}, []);
```

### ✅ 正确: 纯函数映射 + enum

```typescript
// common/components/page-status-view/utils.ts
export enum PageErrorType {
  DEFAULT = 1,
  NETWORK,
  AUTH,
  EMPTY,
}

// 纯函数: 输入 response → 输出 PageErrorType | undefined
export const getPageErrorType = (
  response: BaseResponse,
): PageErrorType | undefined => {
  if (response.code !== 0) return PageErrorType.NETWORK;
  if (!response.data) return PageErrorType.DEFAULT;
  return undefined;
};

// 在数据 hook 中使用:
const error = getPageErrorType(response);
if (error) {
  setErrorType(error);
  return;
}
```

**优势:**

- 错误映射可单独测试
- 所有页面复用同一个映射函数
- 新增错误类型只改一处
- PageStatusView 根据 enum 渲染不同 UI

---

## 4. Slot 组合 vs 巨型组件 {#slot-composition}

### ❌ 当前: 所有 UI 写死在一个组件中

```typescript
// components/chat/message-bubble.tsx — 197 行, 3 个组件
function ReplyPreview({ ... }) { /* 30 行 */ }
function MediaImage({ ... }) { /* 45 行 */ }
export default function MessageBubble({ message }) {
  // 90 行，把所有变体逻辑写死
  return (
    <YStack>
      {!isMe && message.senderName ? <Text>...</Text> : null}
      {hasReply ? <ReplyPreview ... /> : null}
      {hasImage ? <MediaImage url={message.mediaUrl!} ... /> : null}
      {message.text ? <Text>...</Text> : ... }
      <Text>{message.time}</Text>
    </YStack>
  );
}
```

### ✅ 正确: 独立文件 + Slot 组合

```typescript
// pages/chat/components/chat-bubble.tsx — 主组件，通过 slot 组合
interface Props {
  message: MessageItem;
  headerSlot?: ReactNode;     // 发送者名称
  replySlot?: ReactNode;      // 回复预览
  mediaSlot?: ReactNode;      // 媒体内容
  footerSlot?: ReactNode;     // 时间戳
}

export default function ChatBubble({ message, headerSlot, replySlot, mediaSlot, footerSlot }: Props): ReactNode {
  const { isMe } = message;
  return (
    <YStack
      maxWidth="80%"
      bg={isMe ? '$blue9' : '$gray4'}
      borderRadius="$4"
      px="$3"
      py="$2"
    >
      {headerSlot ? headerSlot : null}
      {replySlot ? replySlot : null}
      {mediaSlot ? mediaSlot : null}
      {footerSlot ? footerSlot : null}
    </YStack>
  );
}

// pages/chat/components/chat-reply-preview.tsx — 独立文件
// pages/chat/components/chat-media-image.tsx — 独立文件
// pages/chat/components/chat-timestamp.tsx — 独立文件
```

---

## 5. 判别联合 Context vs 松散可选字段 {#discriminated-union}

### ❌ 松散: 大量可选字段，使用时要猜测哪些存在

```typescript
interface ChatContext {
  scene?: 'direct' | 'group';
  peerId?: string; // 只有 direct 有
  groupId?: string; // 只有 group 有
  memberCount?: number; // 只有 group 有
}
// 使用时: if (ctx.scene === 'direct') { ctx.peerId! } ← 需要 ! 断言
```

### ✅ 正确: 判别联合，TypeScript 自动缩窄

```typescript
interface DirectChatBase {
  scene: 'direct';
  peerId: string; // ← 确定存在
}

interface GroupChatBase {
  scene: 'group';
  groupId: string; // ← 确定存在
  memberCount: number; // ← 确定存在
}

type ChatBase = DirectChatBase | GroupChatBase;

// 使用时: TypeScript 自动缩窄
if (ctx.scene === 'direct') {
  ctx.peerId; // ✅ 自动缩窄为 string，无需 !
}
if (ctx.scene === 'group') {
  ctx.groupId; // ✅ 自动缩窄为 string
  ctx.memberCount; // ✅ 自动缩窄为 number
}
```

---

## 6. Promise 处理 {#promise-handling}

### ❌ 裸调用 Promise (语义不清)

```typescript
fetchData(); // 忘了 await？还是故意不等？
x.close({ animated: true }); // 同上
```

### ✅ 显式 void 或 await

```typescript
// 需要结果 → await
const data = await fetchData();

// 不需要结果 → void 标记
void fetchData();
void x.close({ animated: true });

// useEffect 中的 async
useEffect(() => {
  void fetcher(); // ← void 标记，不是裸调用
}, []);

// 事件处理中的 async
const handleRetry = (): void => {
  void fetcher(); // ← void，返回类型是 void 不是 Promise
};
```

---

## 7. 返回类型显式标注 {#explicit-return-types}

### ❌ 省略返回类型

```typescript
export default function ChatBubble({ message }) {  // ← 无返回类型
  return <YStack>...</YStack>;
}

const usePolling = (callback, interval) => {        // ← 无参数和返回类型
  // ...
};
```

### ✅ 显式标注

```typescript
export default function ChatBubble({ message }: Props): ReactNode {
  return <YStack>...</YStack>;
}

const usePolling = (callback: () => Promise<void>, intervalMs?: number): void => {
  // ...
};

const useFetchData = (session: string | null): UseFetchDataResult => {
  // ...
};

export const getPageErrorType = (response: BaseResponse): PageErrorType | undefined => {
  // ...
};
```

---

## 8. Import 组织 {#import-organization}

### ❌ 无序

```typescript
import { TAB_BAR_CONTENT_HEIGHT } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { Alert } from 'react-native';
import usePageData from '@/hooks/usePageData';
import { YStack, XStack, Text } from 'tamagui';
import type { ProfilePageData } from '@/types/profile';
```

### ✅ 四层分组

```typescript
// 1. React / RN 核心
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

// 2. 第三方
import { useRouter } from 'expo-router';
import { YStack, XStack, Text } from 'tamagui';

// 3. 项目 common/ + service/
import type { ProfilePageData } from '@/common/typings/profile';
import { useAuth } from '@/common/hooks';
import { getPageErrorType } from '@/common/components/page-status-view';
import { fetchProfilePage } from '@/service/profile';

// 4. 页面相对路径
import { POLLING_INTERVAL } from '../consts';
import ProfileCard from './profile-card';
```

---

## 9. 样式系统 {#style-system}

### ❌ 三种方案混用

```typescript
<YStack bg="$background" px="$4">       // Tamagui (大部分)
<View className="flex-1 bg-gray-100">   // Tailwind (零散)
style={{ backgroundColor: '#ffffff' }}   // 硬编码 (危险)
placeholder={isMe ? '#1a6dcc' : '#d4d4d8'} // 硬编码颜色
```

### ✅ Tamagui Only + Token

```typescript
<YStack bg="$background" px="$4" gap="$2" borderRadius="$3">
  <Text color="$color" fontSize="$3" fontWeight="600">
    Hello
  </Text>
</YStack>

// 仅在 Tamagui 不支持时使用 style (需注释原因)
{/* style required: aspectRatio not supported as Tamagui prop */}
<View style={{ aspectRatio }} borderRadius="$3" overflow="hidden" />
```

---

## 10. Barrel Export {#barrel-export}

### ❌ 散装 import

```typescript
import { useAuth } from '@/common/hooks/useAuth';
import { useAppSafeArea } from '@/common/hooks/useSafeArea';
import { useThemeColor } from '@/common/hooks/useThemeColor';
```

### ✅ Barrel import

```typescript
// common/hooks/index.ts
export { useAuth, AuthProvider } from './useAuth';
export { useAppSafeArea } from './useSafeArea';
export { useThemeColor } from './useThemeColor';

// 使用方:
import { useAuth, useAppSafeArea, useThemeColor } from '@/common/hooks';
```

同样适用于页面 hooks:

```typescript
// pages/chat/hooks/index.ts
export { default as useFetchData } from './useFetchData';
export { default as usePolling } from './usePolling';
```
