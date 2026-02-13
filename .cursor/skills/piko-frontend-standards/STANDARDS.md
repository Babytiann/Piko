# Piko Frontend Detailed Coding Standards

## 1. Page-Autonomous Architecture

### 1.1 核心思想

每个页面是一个自包含的业务单元。页面私有代码绝不泄漏到 `common/`，`common/` 的代码绝不依赖 `pages/`。

```
依赖方向 (单向):
  app/ (Screen) → pages/{page}/ → common/
                 pages/{page}/ → service/
                                  service/ → common/services/
```

### 1.2 页面目录标准

```
pages/chat/
├── components/              # 页面私有组件
│   ├── chat-bubble.tsx      # 组件文件 (kebab-case)
│   ├── chat-input.tsx
│   ├── reply-preview.tsx
│   └── media-image.tsx
├── hooks/
│   ├── useFetchData.ts      # 数据 hook
│   ├── usePolling.ts        # 副作用 hook
│   └── index.ts             # barrel: export * from './useFetchData'
├── types/
│   └── index.ts             # 页面所有类型定义
├── consts/
│   └── index.ts             # 页面常量
└── utils/
    └── index.ts             # 页面工具函数
```

### 1.3 提升到 common/ 的判断标准

- **1 个页面使用** → 放 `pages/{page}/` 私有
- **2+ 个页面使用** → 提升到 `common/components/` 或 `common/hooks/`
- **业务相关的共享组件** → `common/components/biz/`
- **纯 UI 无业务** → `common/components/` 根目录

### 1.4 Barrel Export 标准

每个 `hooks/` 和 `common/hooks/` 目录都有 `index.ts`：

```typescript
// common/hooks/index.ts
export { useAuth, AuthProvider } from './useAuth';
export { useAppSafeArea } from './useSafeArea';
export { useThemeColor } from './useThemeColor';
```

使用时 barrel import:

```typescript
import { useAuth, useAppSafeArea } from '@/common/hooks';
```

## 2. Component Architecture

### 2.1 Screen (app/ 下的路由)

Screen 是路由入口，职责是编排，不是实现：

```typescript
// app/(tabs)/profile/index.tsx
import type { ReactNode } from 'react';
import ProfilePage from '@/pages/profile/components/profile-page';

export default function ProfileScreen(): ReactNode {
  return <ProfilePage />;
}
```

或者轻量编排 (当页面简单时):

```typescript
export default function HomeScreen(): ReactNode {
  const { top, bottom } = useAppSafeArea();
  const { data, isLoading, errorType, handleRetry } = useHomeFetchData();

  if (isLoading) return <PageLoading />;
  if (errorType) return <PageStatusView errorType={errorType} onRetry={handleRetry} />;
  if (!data) return null;

  return (
    <YStack flex={1} pt={top} pb={bottom} bg="$background">
      <HomeHeader title={data.header.title} />
      <HomeWelcomeCard data={data.welcomeCard} />
    </YStack>
  );
}
```

### 2.2 Props 设计

```typescript
// 文件内使用: 直接叫 Props (简洁，因为文件名已标识组件)
interface Props {
  title: string;
  showTitle: boolean;
  scene: 'direct' | 'group';
  onClose?: () => void;
}

const ChatAppBar = (props: Props): ReactNode => { ... };
export default ChatAppBar;

// 跨文件导出: 用 {ComponentName}Props
export interface ChatBubbleProps {
  message: MessageItem;
  onReply?: (message: MessageItem) => void;
  showAvatar?: boolean;
}
```

### 2.3 Slot 组合模式

复杂布局通过 Slot props 组合，而非在一个组件中写死：

```typescript
// common/components/product-card/index.tsx
interface Props<T> {
  data: T;
  index: number;
  leftArea?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  operationArea?: ReactNode;
  onPress?: (data: T, index: number) => void;
  onAppear?: (data: T, index: number) => void;
}

export default function CardContainer<T>({
  data,
  index,
  leftArea,
  title,
  subtitle,
  operationArea,
  onPress,
  onAppear,
}: Props<T>): ReactNode {
  return (
    <XStack
      px="$4"
      py="$2"
      onPress={() => onPress?.(data, index)}
    >
      {leftArea ? <YStack flexShrink={0}>{leftArea}</YStack> : null}
      <YStack flex={1} ml="$3" gap="$1">
        {title ? title : null}
        {subtitle ? subtitle : null}
        {operationArea ? operationArea : null}
      </YStack>
    </XStack>
  );
}

// 使用方:
<CardContainer
  data={item}
  index={i}
  leftArea={<ProductImage url={item.imageUrl} />}
  title={<ProductTitle text={item.name} />}
  subtitle={<ProductPrice value={item.price} />}
  operationArea={<BuyButton onPress={handleBuy} />}
/>
```

### 2.4 页面前缀命名

页面私有组件使用页面前缀，避免全局命名冲突：

```
pages/chat/components/
├── chat-bubble.tsx          # ChatBubble
├── chat-input.tsx           # ChatInput
├── chat-context-menu.tsx    # ChatContextMenu

pages/profile/components/
├── profile-card.tsx         # ProfileCard
├── profile-telegram.tsx     # ProfileTelegram
```

## 3. Hook Architecture {#hook-architecture}

### 3.1 数据 Hook (Data Hook)

```typescript
// pages/profile/hooks/useFetchData.ts
import { useState, useEffect, useRef } from 'react';
import {
  getPageErrorType,
  PageErrorType,
} from '@/common/components/page-status-view';
import { fetchProfilePage } from '@/service/profile';
import type { ProfilePageData } from '../types';

interface UseFetchDataResult {
  isLoading: boolean;
  errorType?: PageErrorType;
  data?: ProfilePageData;
  handleRetry: () => void;
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
      const error = getPageErrorType(response);
      if (error) {
        setErrorType(error);
        return;
      }
      setData(response.data);
    } catch {
      setErrorType(PageErrorType.NETWORK);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetcher();
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = (): void => {
    void fetcher();
  };

  return { isLoading, errorType, data, handleRetry };
};

export default useFetchData;
```

**核心要点:**

- 返回类型是 interface `UseFetchDataResult`，不是内联对象
- 错误映射用纯函数 `getPageErrorType(response)`
- 只有 1 个 useEffect
- `void fetcher()` 标记 fire-and-forget
- `handleRetry` 返回 `void` 不返回 `Promise<void>`

### 3.2 派生 Hook (Derived Hook)

纯计算，零副作用，只用 `useMemo`：

```typescript
// common/hooks/useFormattedTime.ts
import { useMemo } from 'react';

export const useFormattedTime = (timestamp: number): string =>
  useMemo(() => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString();
  }, [timestamp]);
```

### 3.3 副作用 Hook (Effect Hook)

单一副作用 + ref 保持回调最新 + cleanup：

```typescript
// pages/chat/hooks/usePolling.ts
import { useEffect, useRef } from 'react';

const usePolling = (
  callback: () => Promise<void>,
  intervalMs?: number,
): void => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return;

    const id = setInterval(() => {
      void callbackRef.current().catch((err: unknown) => {
        console.error('[usePolling]', err);
      });
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);
};

export default usePolling;
```

**核心要点:**

- 返回 `void`，不返回状态
- `useRef` 保持最新回调，避免闭包过期
- 只有 1 个 useEffect
- cleanup 清理 interval
- catch 不为空

### 3.4 组合

```typescript
// 在 Screen 或 Page Component 中组合:
const { isLoading, errorType, data, handleRetry } = useFetchData(chatId);
usePolling(silentRefresh, POLLING_INTERVAL);
```

## 4. Error Handling

### 4.1 纯函数错误映射

```typescript
// common/components/page-status-view/utils.ts
export enum PageErrorType {
  /** 通用错误 */
  DEFAULT = 1,
  /** 网络异常 */
  NETWORK,
  /** 登录过期 */
  AUTH,
  /** 空数据 */
  EMPTY,
}

interface BaseResponse {
  code: number;
  data?: { status_code?: number };
}

/** 纯函数: API 响应 → 错误类型 (undefined 表示成功) */
export const getPageErrorType = (
  response: BaseResponse,
): PageErrorType | undefined => {
  if (response.code !== 0) return PageErrorType.NETWORK;
  if (!response.data) return PageErrorType.DEFAULT;
  if (response.data.status_code !== 0) return PageErrorType.DEFAULT;
  return undefined;
};
```

### 4.2 PageStatusView

```typescript
// common/components/page-status-view/index.tsx
interface Props {
  errorType: PageErrorType;
  onRetry?: () => void;
}

export default function PageStatusView({
  errorType,
  onRetry,
}: Props): ReactNode {
  // 根据 errorType 渲染不同的插画 + 文案 + 重试按钮
}
```

### 4.3 Screen 层使用

```typescript
if (isLoading) return <PageLoading />;
if (errorType) return <PageStatusView errorType={errorType} onRetry={handleRetry} />;
if (!data) return null;

return <ActualContent data={data} />;
```

## 5. Service Layer

### 5.1 一个页面一个 service 文件

```typescript
// service/profile.ts
import type { ApiResult } from '@/common/typings/api';
import { request } from '@/common/services/api-client';
import type { ProfilePageData } from '@/pages/profile/types';

interface ProfileRequest {
  session?: string;
}

interface ProfileResponse extends ApiResult<ProfilePageData> {}

export const fetchProfilePage = async (
  session?: string,
): Promise<ProfileResponse> => {
  return request<ProfileResponse>('profile/detail/v1', {
    method: 'POST',
    body: { session },
  });
};
```

### 5.2 API Client

```typescript
// common/services/api-client.ts
const API_HOST = process.env.EXPO_PUBLIC_API_HOST ?? 'http://localhost:3000';
const API_BASE = `${API_HOST}/piko`;
const DEFAULT_TIMEOUT = 10_000;

interface RequestOptions {
  method: 'GET' | 'POST';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

export async function request<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const { method, body, timeout = DEFAULT_TIMEOUT } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE}/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const json: unknown = await response.json();
    return json as T; // 类型校验由 getPageErrorType 在 hook 层完成
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { code: -1, message: '请求超时' } as T;
    }
    return { code: -1, message: '网络异常' } as T;
  } finally {
    clearTimeout(timer);
  }
}
```

## 6. Context Pattern

### 6.1 判别联合 Context

```typescript
// pages/chat/contexts/chatContext.tsx
import { createContext, useContext, type FC, type ReactNode } from 'react';

interface DirectChatBase {
  scene: 'direct';
  peerId: string;
  getLogParams: () => DirectLogParams;
}

interface GroupChatBase {
  scene: 'group';
  groupId: string;
  memberCount: number;
  getLogParams: () => GroupLogParams;
}

type ChatBase = DirectChatBase | GroupChatBase;

const ChatContext = createContext<ChatBase | undefined>(undefined);

export const useChatBase = (): ChatBase => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatBase must be used within ChatProvider');
  }
  return ctx;
};

/** 缩窄到具体场景 */
export const useDirectChat = (): DirectChatBase => {
  const ctx = useChatBase();
  if (ctx.scene !== 'direct') {
    throw new Error('useDirectChat can only be used in direct chat');
  }
  return ctx;
};

export const ChatProvider: FC<{ value: ChatBase; children: ReactNode }> = ({ value, children }) => (
  <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
);
```

## 7. Promise 处理

```typescript
// ✅ 显式等待
const data = await fetchData();

// ✅ 显式 fire-and-forget (用 void 关键字)
void fetchData();
void x.close({ animated: true });

// ❌ 隐式忽略 (不知道是忘了 await 还是有意不等)
fetchData();
x.close({ animated: true });
```

规则：每个 Promise 要么 `await` 要么 `void`，不允许裸调用。

## 8. Tamagui Style Tokens

| 语义     | Token         | 用途         |
| -------- | ------------- | ------------ |
| 主文本   | `$color`      | 标题、正文   |
| 次要文本 | `$gray10`     | 时间戳、说明 |
| 背景     | `$background` | 页面背景     |
| 卡片背景 | `$gray4`      | 卡片、气泡   |
| 强调     | `$blue9`      | 按钮、链接   |
| 间距     | `$1`~`$8`     | 内外边距     |
| 圆角     | `$1`~`$6`     | borderRadius |
