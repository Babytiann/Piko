---
name: piko-frontend-standards
description: Enforces strict frontend code standards for the Piko Expo/React Native project. Covers page-autonomous architecture, component design, hook taxonomy, type safety, style system, API layer, error handling, and naming conventions. Use when writing, reviewing, or refactoring any frontend code. Automatically apply when creating new components, hooks, services, or types.
---

# Piko Frontend Code Standards

> 严格派：代码即文档，每一行都有存在的理由。

## Core Philosophy

1. **Page Autonomy** — 每个页面是自包含单元，拥有自己的 components/hooks/types/consts/utils
2. **Single Responsibility** — 一个函数/组件/hook 只做一件事
3. **Composition over Complexity** — Slot 组合 > 巨型组件，Hook 组合 > 万能 Hook
4. **Explicit over Implicit** — 所有返回类型显式标注，所有 Promise 要么 await 要么 void
5. **Type as Contract** — 类型系统是模块间的契约，用判别联合而非松散可选字段
6. **Fail Fast, Fail Loud** — 纯函数映射错误类型，不在 hook 里硬编码错误逻辑

## Architecture: Page-Autonomous Structure

```
frontend/
├── app/                           # Expo Router 路由 (Screen 层)
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── index.tsx              # → 编排 pages/home 的内容
│   │   ├── ai/index.tsx
│   │   └── profile/index.tsx
│   └── chat/[id].tsx
│
├── pages/                         # 页面业务单元 (每个页面自包含)
│   ├── home/
│   │   ├── components/            # 页面私有组件
│   │   ├── hooks/                 # 页面私有 hooks
│   │   ├── types/                 # 页面私有类型
│   │   ├── consts/                # 页面私有常量
│   │   └── utils/                 # 页面私有工具函数
│   ├── profile/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── chat/
│       ├── components/
│       ├── hooks/
│       └── types/
│
├── common/                        # 跨页面共享
│   ├── components/
│   │   ├── page-loading/          # 通用加载
│   │   ├── page-status-view/      # 通用错误/空态 + getPageErrorType()
│   │   ├── biz/                   # 业务级共享组件
│   │   └── product-card/          # 可复用卡片 (Slot 组合)
│   ├── hooks/                     # 通用 hooks (useAuth, useSafeArea)
│   │   └── index.ts              # Barrel re-export
│   ├── services/                  # API client + 通用请求
│   ├── typings/                   # 共享类型定义
│   └── consts/                    # 全局常量
│
├── service/                       # 页面级数据获取 (一个页面一个文件)
│   ├── home.ts
│   ├── profile.ts
│   └── chat.ts
│
├── contexts/                      # Context 定义
└── utils/                         # 全局工具函数
```

### 关键原则

```
MUST:  页面私有代码放 pages/{page}/ 下，不放 common/
MUST:  跨 2 个以上页面复用的代码提升到 common/
MUST:  数据获取逻辑放 service/ (按页面分文件)，不内联在组件中
MUST:  common/hooks/index.ts barrel re-export 所有公共 hooks
NEVER: 页面 A 直接 import 页面 B 的私有模块
NEVER: common/ 下的代码 import pages/ 下的代码 (依赖方向: pages → common)
```

## Component Patterns

### 分类与位置

| 类型           | 位置                       | 职责                   |
| -------------- | -------------------------- | ---------------------- |
| Screen         | `app/`                     | 路由入口，编排页面组件 |
| Page Component | `pages/{page}/components/` | 页面私有 UI            |
| Biz Shared     | `common/components/biz/`   | 跨页面业务组件         |
| Base Shared    | `common/components/`       | 通用 UI，零业务        |

### 规则

```
MUST:  Props 接口命名: 文件内用 Props，跨文件导出用 {ComponentName}Props
MUST:  显式返回类型: (props: Props): ReactNode => { ... }
MUST:  页面内组件用页面前缀: Chat 页的组件用 Chat 前缀 (ChatBubble, ChatInput)
MUST:  条件渲染统一三元: {condition ? <X /> : null}
MUST:  空状态统一 return null
MUST:  Slot 组合: 通过 leftArea/title/footer 等 ReactNode props 组合复杂布局
NEVER: 同文件定义多个组件 — 拆分为独立文件
NEVER: 超过 150 行的组件 — 拆分
NEVER: Props 透传超过 2 层 — 用 Context
```

### Slot 组合示例

```typescript
interface Props<T> {
  data: T;
  leftArea?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  operationArea?: ReactNode;
  onPress?: (data: T) => void;
}

export default function CardContainer<T>({ data, leftArea, title, subtitle, operationArea, onPress }: Props<T>): ReactNode {
  return (
    <XStack onPress={() => onPress?.(data)}>
      {leftArea ? <YStack flexShrink={0}>{leftArea}</YStack> : null}
      <YStack flex={1}>
        {title ? title : null}
        {subtitle ? subtitle : null}
        {operationArea ? operationArea : null}
      </YStack>
    </XStack>
  );
}
```

## Hook Taxonomy

### 前置规则: 禁止空壳 re-export

```
NEVER: 创建只做 re-export 的 hook 文件 (如 export { useX } from 'lib')
       → 直接从源库导入，空壳文件是死代码的温床
ONLY:  当你封装了自定义逻辑时，才值得创建 hook 文件
```

Hooks 严格分三类，每类有明确的约束：

### ① 数据 Hook (Data Hook)

职责：获取数据 + 管理 loading/error 状态。返回结构化对象。

```
MUST:  返回命名字段: { isLoading, errorType, data, handleRetry, handleRefresh }
MUST:  错误映射使用纯函数 getPageErrorType()，不在 hook 中硬编码
MUST:  最多 1 个 useEffect (初始加载)
MUST:  返回类型显式定义为 interface
```

### ② 派生 Hook (Derived Hook)

职责：纯计算/数据转换，零副作用。只用 `useMemo`。

```
MUST:  只使用 useMemo，不使用 useEffect / useState
MUST:  纯函数语义: 相同输入永远相同输出
MUST:  命名体现数据来源: useDataFromQuery, useFormattedPrice
```

### ③ 副作用 Hook (Effect Hook)

职责：管理单一副作用 (事件监听、定时器、性能埋点)。

```
MUST:  只有 1 个 useEffect
MUST:  useRef 保存最新回调 (防止闭包过期)
MUST:  cleanup 函数清理所有副作用
MUST:  返回类型为 void (不返回状态)
```

### 组合

```typescript
// pages/chat/hooks/useChatPageData.ts — 数据 hook (单一 effect)
// pages/chat/hooks/useChatPolling.ts — 副作用 hook (单一 effect)
// 在 Screen 层组合:
const pageData = useChatPageData(chatId);
useChatPolling(pageData.silentRefresh, pollingInterval);
```

详见 [STANDARDS.md](STANDARDS.md#hook-architecture) 和 [PATTERNS.md](PATTERNS.md)

## Type Safety

```
MUST:  所有函数参数 + 返回值显式标注类型
MUST:  组件返回类型标注 ReactNode
MUST:  Hook 返回类型定义为 interface (不用内联对象类型)
MUST:  Context 用判别联合 (discriminated union) 区分场景
MUST:  error 使用 enum PageErrorType，不用 string
MUST:  API 响应用 type guard 验证，不用 as T
MUST:  不等待的 Promise 用 void 标记: void doSomething()
NEVER: any — 用 unknown + type guard
NEVER: as T 类型断言
NEVER: ! 非空断言
```

### 判别联合 Context 示例

```typescript
interface ChatDirectContext {
  scene: 'direct';
  peerId: string;
  getLogParams: () => DirectLogParams;
}

interface ChatGroupContext {
  scene: 'group';
  groupId: string;
  memberCount: number;
  getLogParams: () => GroupLogParams;
}

type ChatPageContext = ChatDirectContext | ChatGroupContext;
```

## Error Handling

```
MUST:  纯函数映射错误: getPageErrorType(response) => PageErrorType | undefined
MUST:  PageErrorType 使用 enum (DEFAULT, NETWORK, AUTH, EMPTY)
MUST:  数据 Hook 中调用 getPageErrorType 设置错误状态
MUST:  所有 async 必须 try/catch 或 .catch()
MUST:  不等待的 async 调用加 void 前缀: void fetchData()
NEVER: catch(e) {} 空 catch
NEVER: silentLoad 无 catch — 静默操作也要 console.error
```

### 标准错误流

```
API 响应 → getPageErrorType(resp) → PageErrorType | undefined
                                        ↓
                              undefined = 成功，继续处理
                              PageErrorType = 设置错误状态
                                        ↓
                              Screen: <PageStatusView errorType={errorType} onRetry={handleRetry} />
```

## Style System: Tamagui-First

```
MUST:  布局用 Tamagui props (bg, px, py, gap, flex, borderRadius)
MUST:  颜色只用 theme tokens ($color, $blue9, $gray4, $background)
MUST:  间距只用 size tokens ($1, $2, $3, $4)
NEVER: className / Tailwind
NEVER: 硬编码颜色 (#ffffff, rgba(...))
AVOID: inline style — 仅 Tamagui 不支持的属性 (需注释原因)
```

## Naming Conventions

### 文件

```
组件:     kebab-case.tsx     (chat-bubble.tsx, page-loading.tsx)
Hook:     camelCase.ts       (useFetchData.ts, usePolling.ts)
Service:  camelCase.ts       (chatService.ts, profileService.ts)
Type:     index.ts (在 types/ 目录下)
常量:     index.ts (在 consts/ 目录下)
目录:     kebab-case/        (page-status-view/, operation-button/)
Barrel:   index.ts           (re-export: export * from './useXxx')
```

### 代码

```
组件名:      PascalCase + 页面前缀    ChatBubble, ChatInput, ProfileCard
Hook:        use 前缀                useFetchData, usePolling, useAuth
常量:        UPPER_SNAKE_CASE        TAB_BAR_HEIGHT, POLLING_INTERVAL
Enum:        PascalCase              PageErrorType, ChatScene
函数:        camelCase + 动词        fetchChatList, getPageErrorType, handleRetry
布尔:        is/has/should 前缀      isLoading, hasMedia, shouldRefresh
回调 Props:  on 前缀                 onPress, onRetry, onBind
处理函数:    handle 前缀             handleBind, handleRetry
返回类型:    显式标注                (): ReactNode, (): void, (): Promise<void>
```

## Import Organization

```typescript
// 1. React / React Native 核心
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

// 2. 第三方框架
import { useRouter } from 'expo-router';
import { YStack, Text } from 'tamagui';

// 3. 项目 common/ (shared)
import type { ProfilePageData } from '@/common/typings/profile';
import { useAuth } from '@/common/hooks';
import PageLoading from '@/common/components/page-loading';
import { getPageErrorType } from '@/common/components/page-status-view';

// 4. 项目 service/
import { fetchProfilePage } from '@/service/profile';

// 5. 页面相对路径 (同页面内)
import { POLLING_INTERVAL } from '../consts';
import type { ChatLogParams } from '../types';
import ChatBubble from './chat-bubble';
```

```
MUST:  type-only imports 使用 import type { X }
MUST:  组间保留空行
MUST:  同组内按字母排序
MUST:  common/hooks 用 barrel import: from '@/common/hooks'
```

## Enforcement

写代码时自动检查:

1. 页面私有代码是否放在 pages/{page}/ 下？
2. 组件是否超过 150 行？→ 拆分,依据具体情况拆分，如果真的要这么多，那就不拆了
3. Hook 是否属于明确的分类 (数据/派生/副作用)？
4. Hook 是否有多个 useEffect？→ 拆分
5. 返回类型是否显式标注？→ 补充 ReactNode / void
6. 是否有 any/as/! ？→ type guard
7. error 是否用 enum？→ 不用 string
8. 不等待的 Promise 是否加了 void？
9. 样式是否用 Tamagui token？→ 不用 className/硬编码
10. import 是否按规范分组？

## References

- [STANDARDS.md](STANDARDS.md) — 详细编码标准 + 完整代码实现
- [PATTERNS.md](PATTERNS.md) — 正确模式 vs 反模式对照
- [REVIEW-CHECKLIST.md](REVIEW-CHECKLIST.md) — PR 审查清单
