# Piko Agent 功能设计规范

所有 Agent 功能的前端代码必须严格遵循本文档的设计规范，确保跨页面 UI 一致性。

---

## 1. Design Token（零硬编码）

### 颜色 Token（Tamagui 语义化）

| 语义     | Token         | 用途                   |
| -------- | ------------- | ---------------------- |
| 主文本   | `$color`      | 标题、正文             |
| 次要文本 | `$gray10`     | 时间戳、说明文字       |
| 页面背景 | `$background` | 页面背景色             |
| 卡片背景 | `$gray4`      | 卡片、气泡、输入框背景 |
| 强调色   | `$blue9`      | 按钮、链接、选中态     |
| 间距     | `$1`~`$8`     | 内外边距               |
| 圆角     | `$1`~`$6`     | borderRadius           |

### 业务专用色（定义在 `common/consts/theme.ts`）

```typescript
// common/consts/theme.ts
export const BUDGET_RING_COLOR = '#F5A623'; // 预算环形图黄色
export const BUDGET_RING_BG_COLOR = '#FFF3DC'; // 环形图背景浅黄
export const EXPENSE_CATEGORY_COLORS = {
  餐饮: '#FF6B6B',
  交通: '#4ECDC4',
  娱乐: '#45B7D1',
  购物: '#96CEB4',
  其他: '#DDA0DD',
} as const;
```

### 红线

```
MUST:  颜色通过 Tamagui token 或 theme.ts 常量引用
MUST:  新增业务色在 theme.ts 中定义，命名语义化（BUDGET_RING_COLOR 而非 YELLOW）
NEVER: 组件中直接写 '#F5A623' 或 'rgba(...)' 等硬编码颜色
NEVER: 不同页面同一组件出现不同的背景色/按钮色
```

---

## 2. 共享基础组件

所有 Agent 功能页面必须使用以下统一组件：

### PikoButton

```typescript
// common/components/piko-button.tsx
interface PikoButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  icon?: ReactNode;
}
```

**规则**: 所有可点击按钮必须使用 `PikoButton`，禁止各页面自建按钮组件。
通过 `variant` 控制样式变体，确保全 App 按钮风格一致。

### PikoCard

```typescript
// common/components/piko-card.tsx
interface PikoCardProps {
  children: ReactNode;
  onPress?: () => void;
  padding?: '$2' | '$3' | '$4'; // 默认 $4
  noPadding?: boolean;
}
```

**规则**: 所有卡片容器使用 `PikoCard`（统一圆角 `$4`，背景 `$gray4`）。
通过 Slot 组合控制内容，不在 PikoCard 内硬编码业务逻辑。

### PikoRingChart

```typescript
// common/components/piko-ring-chart.tsx
interface PikoRingChartProps {
  progress: number; // 0~1
  size?: number; // 默认 120
  strokeWidth?: number; // 默认 10
  color?: string; // 默认 BUDGET_RING_COLOR
  bgColor?: string; // 默认 BUDGET_RING_BG_COLOR
  centerIcon?: ReactNode; // 中心图标（如 $ 符号）
  animated?: boolean; // 默认 true
}
```

**实现**: `react-native-svg` + `react-native-reanimated` 绘制动画环形图。
progress 变化时用 `withSpring` 平滑过渡，不跳变。

### PikoWeekCalendar

```typescript
// common/components/piko-week-calendar.tsx
interface PikoWeekCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  markedDates?: Record<string, { dot?: boolean; amount?: number }>;
}
```

**实现**: 横排周视图，当日圆形高亮，GestureHandler 左右滑动切换周。
参考 CalSaver 截图样式：紧凑排列，周几标签 + 日期数字。

---

## 3. 动画规范

### 原则

- 使用 `react-native-reanimated` 实现所有动画
- 保持 60fps 流畅，动画在 UI 线程执行
- 有克制：动画是锦上添花，不是干扰用户
- 参数集中管理，不在组件中硬编码

### 动画参数（`common/consts/animation.ts`）

```typescript
// common/consts/animation.ts
import { Easing } from 'react-native-reanimated';

/** 通用弹性配置 */
export const SPRING_CONFIG = { damping: 15, stiffness: 150 };

/** 快速过渡 (ms) */
export const TIMING_FAST = 200;

/** 标准过渡 (ms) */
export const TIMING_NORMAL = 300;

/** 慢速强调 (ms) */
export const TIMING_SLOW = 500;

/** 列表项逐个入场延迟 (ms) */
export const STAGGER_DELAY = 50;

/** 标准缓动曲线 */
export const EASING_STANDARD = Easing.bezier(0.4, 0, 0.2, 1);
```

### 必须有动画的场景

| 场景        | 动画类型             | 实现                                                                       |
| ----------- | -------------------- | -------------------------------------------------------------------------- |
| 页面转场    | FadeIn/FadeOut       | `entering={FadeIn.duration(TIMING_NORMAL)}`                                |
| 列表项出现  | FadeInDown + Stagger | `entering={FadeInDown.delay(index * STAGGER_DELAY)}`                       |
| 环形图进度  | Spring               | `withSpring(targetProgress, SPRING_CONFIG)`                                |
| 日历切换    | Timing + Bezier      | `withTiming(offset, { duration: TIMING_NORMAL, easing: EASING_STANDARD })` |
| AI 回复气泡 | SlideInUp + Spring   | `entering={SlideInUp.springify()}`                                         |
| 卡片按压    | Spring Scale         | `withSpring(0.98, SPRING_CONFIG)` -> `withSpring(1, SPRING_CONFIG)`        |
| 加载态      | Shimmer              | 骨架屏渐变闪烁动画                                                         |
| 金额数字    | CountUp              | `withTiming` 从旧值滚动到新值                                              |

### 红线

```
MUST:  所有动画参数引用 animation.ts 中的常量
MUST:  动画使用 Reanimated（UI 线程），不用 Animated（JS 线程）
MUST:  列表项入场用 stagger 逐个出现，不要同时出现
MUST:  数据可视化（环形图/数字）变化时有过渡动画
NEVER: 动画时长超过 500ms（用户会觉得卡）
NEVER: 组件中硬编码动画参数（duration: 300 等）
NEVER: 使用 `Animated` API（用 `Reanimated`）
```

---

## 4. 代码质量红线

以下是不可妥协的底线，每次产出代码必须自查：

### 组件规范

1. **不超过 150 行** — 超过就拆分，通过 Slot 组合
2. **一个文件一个组件** — 不在同文件定义多个组件
3. **页面前缀命名** — `HomeBudgetCard`, `ScanCameraView`, `AiChatBubble`
4. **Props interface** — 文件内用 `Props`，导出用 `{ComponentName}Props`
5. **显式返回类型** — `(props: Props): ReactNode`
6. **条件渲染用三元** — `{condition ? <X /> : null}`

### Hook 规范

1. **严格三分类** — 数据 Hook / 派生 Hook / 副作用 Hook
2. **每个 Hook 最多 1 个 useEffect**
3. **数据 Hook 返回 interface**（不用内联对象类型）
4. **纯函数映射错误** — `getPageErrorType(response)`
5. **useRef 保持最新回调**（副作用 Hook 中）

### 类型规范

1. **所有函数参数 + 返回值显式标注**
2. **error 用 enum（PageErrorType）不用 string**
3. **Promise 要么 await 要么 void**
4. **type-only import** — `import type { X }`
5. **禁止 any / as / !**

### 样式规范

1. **Tamagui-first** — 布局用 Tamagui props
2. **颜色只用 token** — `$color`, `$blue9`, 不用 `#xxx`
3. **间距只用 size token** — `$1`~`$8`
4. **业务色走 theme.ts 常量**

### 额外模式（参考 local_service_c）

- **ts-pattern** — 对 Agent 状态机做穷尽匹配分支
- **ErrorBoundary** — 组件级错误兜底，renderFallback
- **显式 Props 接口** — 不用内联类型
