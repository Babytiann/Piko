# Piko Code Review Checklist

严重程度分级:

- **P0 阻断**: 必须修复
- **P1 重要**: 强烈建议修复
- **P2 建议**: 可下次迭代

---

## Architecture (架构)

| #   | 检查项                                                          | 级别 |
| --- | --------------------------------------------------------------- | ---- |
| A1  | 页面私有代码是否在 `pages/{page}/` 下？(不散落在 common/)       | P0   |
| A2  | pages/ 的代码是否 import 了其他 pages/ 的模块？(禁止跨页面依赖) | P0   |
| A3  | common/ 的代码是否 import 了 pages/ 的模块？(依赖方向错误)      | P0   |
| A4  | 组件是否超过 150 行？→ 拆分                                     | P0   |
| A5  | 同文件是否有多个组件定义？→ 拆到独立文件                        | P1   |
| A6  | 复杂布局是否使用 Slot 组合？(不硬编码所有变体)                  | P1   |
| A7  | Props 透传是否超过 2 层？→ 用 Context                           | P1   |
| A8  | 跨 2+ 页面的组件是否提升到 common/？                            | P2   |

## Hook Design (Hook 设计)

| #   | 检查项                                                   | 级别 |
| --- | -------------------------------------------------------- | ---- |
| H1  | Hook 是否属于明确分类？(数据/派生/副作用)                | P0   |
| H2  | Hook 是否有多个 useEffect？→ 拆分                        | P0   |
| H3  | 数据 Hook 返回类型是否定义为 interface？(不用内联类型)   | P1   |
| H4  | 数据 Hook 的 errorType 是否使用 enum？(不用 string)      | P1   |
| H5  | 数据 Hook 是否使用 `getPageErrorType()` 纯函数映射错误？ | P1   |
| H6  | 派生 Hook 是否只使用 useMemo？(无 useEffect/useState)    | P0   |
| H7  | 副作用 Hook 是否用 useRef 保持回调最新？                 | P1   |
| H8  | 副作用 Hook 返回类型是否为 void？                        | P1   |
| H9  | hooks/ 目录是否有 index.ts barrel export？               | P2   |

## Type Safety (类型安全)

| #   | 检查项                                                       | 级别 |
| --- | ------------------------------------------------------------ | ---- |
| T1  | 是否使用了 `any`？→ `unknown` + type guard                   | P0   |
| T2  | 是否使用了 `as T` 类型断言？→ type guard 或 asserts          | P0   |
| T3  | 是否使用了 `!` 非空断言？→ 条件缩窄                          | P0   |
| T4  | 函数返回类型是否显式标注？(ReactNode / void / Promise<void>) | P1   |
| T5  | 组件 Props 是否有 interface 定义？                           | P1   |
| T6  | Context 是否使用判别联合？(不用大量可选字段)                 | P1   |
| T7  | Promise 是否 await 或 void？(不允许裸调用)                   | P1   |
| T8  | type import 是否使用 `import type`？                         | P2   |

## Error Handling (错误处理)

| #   | 检查项                                                        | 级别 |
| --- | ------------------------------------------------------------- | ---- |
| E1  | 所有 async 是否有 try/catch？                                 | P0   |
| E2  | catch 块是否为空？(至少 console.error)                        | P0   |
| E3  | 静默操作 (silentRefresh) 是否有 catch？                       | P0   |
| E4  | 错误映射是否用 `getPageErrorType()` 纯函数？                  | P1   |
| E5  | Screen 是否有三态守卫？(loading → error → null → render)      | P1   |
| E6  | PageStatusView 是否接收 errorType enum？(不是 string message) | P1   |

## Style (样式)

| #   | 检查项                                           | 级别 |
| --- | ------------------------------------------------ | ---- |
| S1  | 是否使用了 className / Tailwind？→ Tamagui props | P0   |
| S2  | 是否有硬编码颜色？(#fff, rgba) → theme token     | P0   |
| S3  | 是否有硬编码数字间距？→ size token               | P1   |
| S4  | inline style 是否有注释说明原因？                | P2   |

## Naming (命名)

| #   | 检查项                                                         | 级别 |
| --- | -------------------------------------------------------------- | ---- |
| N1  | 组件文件是否 kebab-case.tsx？                                  | P1   |
| N2  | 页面内组件是否有页面前缀？(ChatBubble, ProfileCard)            | P1   |
| N3  | Props 命名: 文件内 `Props`，导出时 `{Name}Props`？             | P2   |
| N4  | 回调 Props on 前缀？处理函数 handle 前缀？                     | P2   |
| N5  | 布尔值 is/has/should 前缀？                                    | P2   |
| N6  | 返回值命名: isLoading (不是 loading)，errorType (不是 error)？ | P2   |
| N7  | 是否有拼写错误？                                               | P1   |

## Imports (导入)

| #   | 检查项                                               | 级别 |
| --- | ---------------------------------------------------- | ---- |
| I1  | 四层分组: React → 三方 → common/service → 相对路径？ | P2   |
| I2  | common/hooks 是否 barrel import？                    | P2   |
| I3  | 是否有未使用的 import？                              | P1   |
| I4  | type import 是否用 `import type`？                   | P2   |

## API Layer (API 层)

| #   | 检查项                                         | 级别 |
| --- | ---------------------------------------------- | ---- |
| AP1 | API HOST 是否从环境变量读取？(不硬编码 IP)     | P0   |
| AP2 | 请求是否有超时？                               | P1   |
| AP3 | service 文件是否按页面组织？(一个页面一个文件) | P1   |
| AP4 | Request/Response 类型是否显式定义？            | P1   |

---

## 快速自查 (写完代码后过一遍 P0)

```
□ A1  页面私有代码在 pages/{page}/ 下
□ A2  无跨页面 import
□ A4  组件 < 150 行
□ H1  Hook 分类清晰 (数据/派生/副作用)
□ H2  每个 Hook ≤ 1 个 useEffect
□ T1  无 any
□ T2  无 as T
□ T3  无 !
□ T4  返回类型显式标注
□ T7  Promise 全部 await 或 void
□ E1  async 全有 catch
□ E2  catch 不为空
□ S1  无 className
□ S2  无硬编码颜色
□ AP1 无硬编码 IP
```

## 当前项目优先修复项

按收益/成本排序:

| 优先级 | 重构项                                   | 涉及检查项     | 预估工作量                  |
| ------ | ---------------------------------------- | -------------- | --------------------------- |
| 1      | 建立 pages/ 目录结构                     | A1, A2, A3     | 中 (文件移动 + import 更新) |
| 2      | usePageData → 数据Hook + 副作用Hook 拆分 | H1, H2, H5, E4 | 小                          |
| 3      | API Client 统一 + 环境变量               | AP1, AP2       | 小                          |
| 4      | 错误处理: string → PageErrorType enum    | H4, E4, E6     | 小                          |
| 5      | 样式统一: 移除 className + 硬编码颜色    | S1, S2         | 中                          |
| 6      | 子组件拆分 (message-bubble 等)           | A4, A5         | 小                          |
| 7      | 添加返回类型标注 + void 标记             | T4, T7         | 小                          |
| 8      | Context 判别联合                         | T6             | 小                          |
