---
name: piko-home-slash-layout
description: Piko 首页（及同类「单接口一屏」）采用 Slash 式数据契约——单接口一次性返回 layout + nodes，前端按 layout.body 顺序渲染各模块。参考 local_services_web_monorepo 下 poi-reactlynx-next-rs 的 productDetail slash 结构。
---

# Piko 首页 Slash 式布局规范

> 设计理念：**一个接口、一次请求、一份数据**。页面所有模块的数据由同一个接口一次性下发，通过 `layout` 定义顺序，通过 `nodes` 承载各模块数据；前端按顺序取数、按 slot 渲染，不拆多接口、不按模块分请求。

## 核心原则

1. **单接口** — 首页（home）仅调用一个接口（如 `homepage/summary/v1` 或 `home/slash/v1`），不按「周日历」「预算」「天气」等拆成多个 API。
2. **Layout 定序** — 接口返回 `layout` 描述页面结构，至少包含 `body: string[]`，表示主内容区从上到下的 slot ID 顺序。
3. **Nodes 载数** — 接口返回 `nodes: Record<string, Node>`，每个 key 对应一个 slot；每个 node 含 `type`（如 `container` / `component` / `group`）和 `data`（该模块业务数据）。
4. **前端按序渲染** — 前端根据 `layout.body` 遍历，对每个 slot ID 从 `nodes[slotId]` 取数据，再根据 slot ID 或 node.type 映射到对应 UI 组件。

## 参考：Slash 结构形态

参考项目：`local_services_web_monorepo/subspaces/local_service_c/apps/poi-reactlynx-next-rs`（productDetail slash v2、closedLoop 渲染）。

**接口响应形态（可简化，理念一致即可）：**

```ts
// 响应根
{
  success: true,
  data: {
    layout: {
      body: ["week_calendar", "budget_card", "category_cards", "weather_card", "ai_advice_card", "expense_list"],
      header?: string[],
      footer?: string[]
    },
    nodes: {
      week_calendar:    { type: "component", data: WeekCalendarData },
      budget_card:      { type: "component", data: BudgetCardData },
      category_cards:   { type: "component", data: CategoryCardsData },
      weather_card:     { type: "component", data: WeatherCardData },
      ai_advice_card:   { type: "component", data: AiAdviceCardData },
      expense_list:     { type: "component", data: ExpenseListData }
    },
    extra?: { logid?: string, now?: number }
  }
}
```

- `layout.body`：主内容区从上到下的 slot ID 顺序，前端按此顺序渲染。
- `nodes[slotId]`：每个 slot 的 `type` + `data`；`data` 由后端与前端约定类型，与对应组件 props 一致。
- 若有 `header` / `footer`，可同样用 `layout.header`、`layout.footer` 数组 + `nodes` 渲染。

## 后端约定

- **路由**：保持单一首页接口（如现有 `homepage/summary/v1`），在该接口内聚合所有首页所需数据（预算、天气、AI 建议、今日消费、周日历等），组装成 `layout` + `nodes`。
- **类型**：在 `backend/types/home.ts`（或等价）中定义 `HomeSlashLayout`、`HomeSlashNodes` 及各 slot 的 `data` 类型，与前端 `common/typings/home.ts` 对齐。
- **扩展**：新增模块时，在 `layout.body` 中增加 slot ID，在 `nodes` 中增加对应 key 与 data，前端增加该 slot 的渲染分支即可；不新增接口。

## 前端约定

- **单次请求**：首页只调一个 fetch（如 `fetchHomePage()`），返回即包含 `data.layout` 与 `data.nodes`。
- **解析**：在 `useFetchData`（或首页专用 hook）中解析 `bodyLayout = data.layout?.body ?? []`，`nodes = data.nodes ?? {}`。
- **渲染**：首页 Screen 中 `bodyLayout.map((slotId) => { const node = nodes[slotId]; return <SlotRenderer key={slotId} slotId={slotId} node={node} />; })`；`SlotRenderer` 内部根据 `slotId` 或 `node.type` 映射到具体组件（如 `HomeWeekCalendar`、`HomeBudgetCard` 等），并传入 `node.data`。
- **类型**：前端 `HomePageData`（或 `HomeSlashResponse`）类型包含 `layout: { body: string[]; ... }` 与 `nodes: Record<string, { type: string; data?: unknown }>`，各 slot 的 data 类型可细化为联合类型或泛型，便于类型安全。

## Slot 与组件映射

| layout.body slot_id | 说明         | nodes[slot_id].data 用途 |
| ------------------- | ------------ | ------------------------ |
| week_calendar       | 周日历       | 周区间、选中日、可选配置 |
| budget_card         | 预算环形图   | 已花/预算、进度、金额    |
| category_cards      | 分类消费卡片 | 餐饮/交通/娱乐等分类汇总 |
| weather_card        | 天气         | 城市、温度、描述、图标   |
| ai_advice_card      | AI 消费建议  | 建议文案、生成时间       |
| expense_list        | 今日消费列表 | 列表项数组               |

后端按上述 slot 组装 data；前端按 slot_id 渲染对应组件，组件只消费 `node.data`，不关心接口形态。

## 与 piko-frontend-standards 的关系

- 页面仍遵循 **pages/home/** 自包含（components / hooks / types）。
- **Slot 组件**：每个 slot 对应 `pages/home/components/` 下的一个展示组件（如 `home-week-calendar.tsx`），组件接收 `data` 作为 props，不直接依赖全局接口形状。
- **Data Hook**：首页只需一个「拉取首页数据」的 Hook（如 `useFetchData`），返回 `{ layout, nodes, loading, error, retry }`；不需要按模块拆成多个 useHomeXxx 请求。
- **类型**：slot data 类型在 `pages/home/types/` 或 `common/typings/home.ts` 中定义，与后端 types 对齐。

## 何时启用

- 设计或实现 **首页（Home）**、或任何「单屏单接口」的列表/仪表盘页时，优先采用本 Slash 式契约。
- 评审首页接口形态、或新增首页模块时，检查是否符合「单接口 + layout.body + nodes」与「前端按序渲染」的约定。
