# AI Agent 全栈开发课程大纲

每个模块按顺序推进，后续模块依赖前序模块的产出。

---

## 模块 1: Agent 基础 — LLM 接入

**实战功能**: 在 `/ai` Tab 页构建 AI 聊天助手（与 Gemini 对话）

**功能描述**: 用户在 AI Tab 页与 Gemini 大模型聊天，支持流式打字效果。右上角有切换按钮跳转到 `/ai/telegram`（原 Telegram 对话列表）。

**前端变更**:

- `app/(tabs)/ai/index.tsx` — 改为 AI 聊天页面
- `app/ai/telegram.tsx` — 新增，Telegram 对话列表（内容从原 ai/index.tsx 迁移）
- `pages/ai-chat/` — 新增页面模块（components/ hooks/ types/）
- `services/ai.ts` — 新增 AI 服务

**后端变更**:

- `app/piko/ai/chat/v1/route.ts` — 新增 AI 聊天路由（SSE Streaming）
- `lib/services/ai.ts` — 新增 Gemini API 封装

**核心技术点**:

1. `@google/generative-ai` 包接入 Gemini API
2. `generateContentStream` 实现流式输出
3. 后端 SSE 端点实现（Next.js Route Handler + ReadableStream）
4. 前端 SSE 消费（EventSource / fetch + ReadableStream）
5. 聊天 UI：复用 `chat-detail` 的气泡组件模式
6. AI 消息打字效果动画（逐字显示 + 光标闪烁）
7. 消息列表：本地 state 管理（后续模块 3 持久化）

**教学要点**:

- 用 `chat-detail` 的 `useFetchData` 类比 AI 聊天的数据 Hook
- SSE 对比 Polling（为什么不用 `usePolling`）
- API Key 安全实践（为什么不能放前端）

---

## 模块 2: Tool Calling — 让 Agent 使用实用工具

### 2A: AI 出行规划助手

**实战功能**: 用户输入目的地，Agent 搜索景点、规划路线、展示嵌入式地图

**前端变更**:

- `pages/ai-chat/components/ai-chat-route-card.tsx` — 路线结果卡片
- `pages/ai-chat/components/ai-chat-map-view.tsx` — WebView 嵌入 H5 地图
- `frontend/public/map.html` — H5 地图页面（Leaflet / 高德 JS API）

**后端变更**:

- `app/piko/ai/chat/v1/route.ts` — 扩展支持 Tool Calling
- `lib/services/ai-tools.ts` — 工具注册框架
- `lib/services/tools/search-attractions.ts` — 景点搜索工具
- `lib/services/tools/plan-route.ts` — 路线规划工具
- `lib/services/tools/get-map-route.ts` — 地图路线数据工具

**核心技术点**:

1. Gemini Function Calling 定义工具 schema
2. ReAct 循环：搜索 -> 筛选 -> 规划 -> 渲染
3. 统一的 Tool Registry 框架（注册、发现、执行）
4. 高德地图 API（POI 搜索 + 路线规划）
5. React Native WebView 嵌入 H5 地图 + postMessage 通信
6. Agent 思考过程可视化（步骤卡片 + loading 态）

### 2B: AI 智能记账 — 截图识别 + 预算管理

**实战功能**: `/scan` Tab 页拉起相机拍小票/截图，Gemini Vision 识别金额，自动记账

**前端变更**:

- `app/(tabs)/scan/index.tsx` — 记账页面（相机预览为主体）
- `pages/scan/components/scan-camera-view.tsx` — 相机预览组件
- `pages/scan/components/scan-preview-confirm.tsx` — 拍照确认页
- `pages/scan/components/scan-result-form.tsx` — AI 识别结果表单（可编辑）
- `pages/scan/components/scan-manual-input.tsx` — 手动输入表单
- `pages/scan/hooks/useScanCamera.ts` — 相机管理 Hook
- `pages/scan/hooks/useScanRecognize.ts` — AI 识别 Hook

**后端变更**:

- `app/piko/ai/recognize/v1/route.ts` — 图片识别路由
- `lib/services/tools/recognize-payment.ts` — 支付截图识别工具
- `lib/services/tools/add-expense.ts` — 添加消费记录工具

**核心技术点**:

1. `expo-camera` 相机预览 + 拍照
2. `expo-image-picker` 相册选择
3. Gemini Vision 多模态：图片 -> 结构化消费数据
4. 识别结果可编辑确认页
5. 消费分类自动归类（餐饮/交通/娱乐/购物等）

**记账页面交互流程**:

```
进入 /scan Tab
    ↓
请求相机权限（首次）
    ↓
展示相机实时预览（全屏）
底部: [相册] [快门按钮] [手动输入]
    ↓ 拍照
预览确认页: [重拍] [使用此照片]
    ↓ 确认
上传图片 -> Gemini Vision 识别
    ↓
识别结果表单（金额/商家/分类/日期，均可编辑）
    ↓ 确认
写入数据库，首页环形图更新
```

### 2C: 首页整合 — 日历 + 预算 + 天气 + AI 消费建议

**实战功能**: 首页 `/` Tab 整合所有生活模块

**前端变更**:

- `app/(tabs)/index.tsx` — 首页重构
- `pages/home/components/home-week-calendar.tsx` — 周日历（使用 PikoWeekCalendar）
- `pages/home/components/home-budget-card.tsx` — 预算环形图卡片
- `pages/home/components/home-category-cards.tsx` — 分类消费小卡片（三列）
- `pages/home/components/home-weather-card.tsx` — 天气卡片
- `pages/home/components/home-ai-advice-card.tsx` — AI 消费建议卡片
- `pages/home/components/home-expense-list.tsx` — 今日消费记录列表
- `pages/home/hooks/useHomeBudgetData.ts` — 预算数据 Hook
- `pages/home/hooks/useHomeWeatherData.ts` — 天气数据 Hook
- `pages/home/hooks/useHomeAdviceData.ts` — AI 建议数据 Hook

**后端变更**:

- `app/piko/budget/summary/v1/route.ts` — 预算概览
- `app/piko/weather/current/v1/route.ts` — 天气查询
- `app/piko/ai/advice/v1/route.ts` — AI 消费建议生成
- `lib/services/weather.ts` — OpenWeatherMap 封装
- `lib/services/budget.ts` — 预算计算逻辑

**首页布局（参考 CalSaver）**:

```
[Header: Piko + 天气图标]
[周日历: 周日~周六，当日高亮圆圈]
[预算卡片: 大字剩余金额 + 环形图]
[三列分类卡片: 餐饮/交通/娱乐]
[天气卡片: 紧凑单行]
[AI 建议卡片: 个性化消费建议]
[今日消费列表]
```

---

## 模块 3: 持久化存储 — 给 Agent 加记忆

**实战功能**: 消费记录、预算、出行历史、AI 对话历史持久化到 PostgreSQL

**后端变更**:

- `prisma/schema.prisma` — 数据模型定义
- `lib/prisma.ts` — Prisma Client 实例

**数据模型**:

```prisma
model User {
  id        String   @id @default(cuid())
  session   String   @unique
  city      String?
  createdAt DateTime @default(now())
  budgets   Budget[]
  expenses  Expense[]
  trips     Trip[]
  chats     ChatMessage[]
}

model Budget {
  id        String   @id @default(cuid())
  userId    String
  month     String   // "2026-02"
  total     Float
  categories Json    // { "餐饮": 800, "交通": 500, ... }
  user      User     @relation(fields: [userId], references: [id])
}

model Expense {
  id        String   @id @default(cuid())
  userId    String
  amount    Float
  category  String
  merchant  String?
  note      String?
  date      DateTime
  source    String   // "camera" | "album" | "manual"
  user      User     @relation(fields: [userId], references: [id])
}

model Trip {
  id          String   @id @default(cuid())
  userId      String
  destination String
  startDate   DateTime
  endDate     DateTime
  routeData   Json?
  user        User     @relation(fields: [userId], references: [id])
}

model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  role      String   // "user" | "assistant" | "tool"
  content   String
  toolCalls Json?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

**核心技术点**:

1. Prisma ORM 安装与配置
2. 数据模型设计（关系、索引、JSON 字段）
3. Prisma Migrate 数据库迁移
4. Agent Memory：短期（对话上下文 window）vs 长期（历史消费模式）
5. 聚合查询：按月/周/日汇总消费数据

---

## 模块 4: 定时任务 — Agent 自主行动

**实战功能**: 每天早晨 8 点自动生成"每日简报"并推送系统通知

**后端变更**:

- `lib/scheduler/index.ts` — 定时任务调度器
- `lib/scheduler/jobs/daily-briefing.ts` — 每日简报任务
- `lib/services/briefing.ts` — 简报组装逻辑

**任务流程**:

```
08:00 触发
  ↓
查询用户城市 -> OpenWeatherMap 天气
  ↓
查询用户本周消费 -> Gemini 生成消费建议
  ↓
查询临近出行计划 -> 附加目的地天气
  ↓
组装简报内容 -> Expo Push Notification
```

**核心技术点**:

1. `node-cron` 定时触发
2. 任务编排：串联多个异步步骤
3. 错误重试策略（单步失败不影响整体）
4. 前端任务配置页（个人中心 -> 推送设置）

---

## 模块 5: 推送通知 — 主动触达用户

**实战功能**: Agent 通过系统通知推送每日简报、预算预警、出行提醒

**前端变更**:

- `common/hooks/usePushNotifications.ts` — 推送注册 Hook
- `common/services/push.ts` — Push Token 管理
- `pages/profile/components/profile-notification-settings.tsx` — 通知设置

**后端变更**:

- `lib/services/push.ts` — Expo Push 发送服务
- `app/piko/push/register/v1/route.ts` — Token 注册端点

**通知类型**:

- 每日消费建议（08:00）
- 预算预警（消费超过 80% 时）
- 出行提醒（出发前 1 天）
- 天气突变提醒

**核心技术点**:

1. `expo-notifications` 权限请求与 Token 获取
2. Expo Push API 服务端发送
3. 通知点击 -> Deep Link 跳转到对应页面
4. 通知偏好设置（用户可开关各类通知）

---

## 模块 6: RAG — 让 Agent 理解你的数据

**实战功能**: 基于 Telegram 聊天记录的智能搜索与问答

**后端变更**:

- `lib/services/embedding.ts` — Gemini Embedding 封装
- `lib/services/vector-store.ts` — pgvector 向量存储
- `lib/services/rag.ts` — RAG 流水线
- `app/piko/ai/search/v1/route.ts` — 语义搜索端点

**核心技术点**:

1. Gemini Embedding API 文本向量化
2. pgvector 扩展（PostgreSQL 原生向量检索）
3. Telegram 消息批量索引构建
4. RAG 流水线：Query -> Embed -> Retrieve -> Augment -> Generate
5. 语义搜索 vs 关键词搜索对比
6. 前端搜索 UI：搜索框 + 结果列表 + AI 摘要

---

## 模块 7: 多 Agent 协作 — 构建个人生活助理系统

**实战功能**: 出行 + 记账 + 消费建议 + 天气 Agent 协作

**示例场景**:

```
用户: "我下周想去杭州玩两天"
  ↓
Router Agent 识别意图 -> 出行规划
  ↓
出行 Agent: 生成杭州行程 + 路线地图
  ↓ 输出传递给
记账 Agent: 预估旅行开支，预留预算
  ↓ 输出传递给
消费建议 Agent: "下周有杭州之行，本周建议节省开支"
  ↓ 并行
天气 Agent: 查询杭州下周天气，补充到行程中
```

**后端变更**:

- `lib/agents/registry.ts` — Agent 注册中心
- `lib/agents/router.ts` — 意图识别路由
- `lib/agents/travel-agent.ts` — 出行规划 Agent
- `lib/agents/budget-agent.ts` — 记账 Agent
- `lib/agents/advice-agent.ts` — 消费建议 Agent
- `lib/agents/weather-agent.ts` — 天气 Agent
- `lib/agents/orchestrator.ts` — 编排器

**核心技术点**:

1. Agent 编排模式（Router / Pipeline / Supervisor）
2. Agent 间通信协议（输入/输出标准化）
3. 上下文共享（共享用户偏好和预算数据）
4. 错误隔离（单个 Agent 失败不影响其他）
5. 每日生活简报（Morning Brief）：天气 + 预算 + 建议 + 行程
