# Piko 项目架构速查

供 AI 教学时快速参考项目结构、API 端点、文件职责。

---

## 1. 项目概览

| 层       | 技术                                                | 路径                      |
| -------- | --------------------------------------------------- | ------------------------- |
| 前端     | Expo 54 / React Native 0.81 / Tamagui / Expo Router | `frontend/`               |
| 后端     | Next.js 16 App Router / TypeScript                  | `backend/`                |
| Telegram | GramJS (MTProto)                                    | `backend/lib/telegram.ts` |
| 包管理   | pnpm workspaces                                     | `pnpm-workspace.yaml`     |

---

## 2. 前端目录结构

```
frontend/
├── app/                           # Expo Router 路由 (Screen 层)
│   ├── _layout.tsx               # 根 Layout: TamaguiProvider + AuthProvider + Stack
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab Layout (GlassTabBar)
│   │   ├── index.tsx             # 首页 → pages/home/
│   │   ├── ai/index.tsx          # AI 聊天 → pages/ai-chat/ (重构后)
│   │   ├── profile/index.tsx     # 个人中心 → pages/profile/
│   │   └── scan/index.tsx        # 记账 → pages/scan/ (新增)
│   ├── ai/
│   │   └── telegram.tsx          # Telegram 对话列表 (新增，从原 ai/index.tsx 迁移)
│   ├── chat/[id].tsx             # 聊天详情
│   └── telegram_login/           # Telegram 登录流程
│
├── pages/                         # 页面业务单元 (每个页面自包含)
│   ├── home/                     # 首页 (日历+预算+天气+建议)
│   │   ├── components/
│   │   └── hooks/
│   ├── ai-chat/                  # AI 聊天 (新增)
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── scan/                     # 记账 (新增)
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   ├── chat-list/                # Telegram 对话列表
│   ├── chat-detail/              # 聊天详情
│   ├── profile/                  # 个人中心
│   └── telegram-login/           # Telegram 登录
│
├── common/                        # 跨页面共享
│   ├── components/
│   │   ├── page-loading/         # 通用加载
│   │   ├── page-status-view/     # 通用错误/空态
│   │   ├── glass-tab-bar/        # 毛玻璃 Tab 栏
│   │   ├── avatar.tsx            # 头像组件
│   │   ├── piko-button.tsx       # 统一按钮 (新增)
│   │   ├── piko-card.tsx         # 统一卡片 (新增)
│   │   ├── piko-ring-chart.tsx   # 环形图 (新增)
│   │   └── piko-week-calendar.tsx # 周日历 (新增)
│   ├── hooks/
│   │   ├── useAuth.ts            # 认证
│   │   └── index.ts              # Barrel re-export
│   ├── consts/
│   │   ├── index.ts              # 通用常量
│   │   ├── theme.ts              # 业务色/设计 Token
│   │   └── animation.ts          # 动画参数 (新增)
│   ├── typings/                  # 共享类型
│   └── services/
│       └── api-client.ts         # API 请求封装
│
├── services/                      # 页面级数据获取
│   ├── index.ts                  # 统一导出
│   ├── ai.ts                    # AI 服务 (新增)
│   └── budget.ts                # 预算服务 (新增)
│
└── contexts/                      # Context 定义
```

---

## 3. 后端目录结构

```
backend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── piko/                     # API 路由 (所有端点前缀 /piko)
│       ├── homepage/summary/v1/route.ts
│       ├── profile/detail/v1/route.ts
│       ├── chat/
│       │   ├── list/v1/route.ts
│       │   └── detail/v1/route.ts
│       ├── telegram/             # Telegram 相关
│       │   ├── auth/v1/route.ts
│       │   ├── send-message/v1/route.ts
│       │   ├── get-dialogs/v1/route.ts
│       │   ├── get-messages/v1/route.ts
│       │   ├── avatar/v1/route.ts
│       │   ├── profile-photo/v1/route.ts
│       │   ├── media/v1/route.ts
│       │   └── text_detail/v1/route.ts
│       ├── ai/                   # AI 相关 (新增)
│       │   ├── chat/v1/route.ts      # AI 流式聊天 (SSE)
│       │   └── action/v1/route.ts    # 统一 AI 动作 (recognize/advice/search)
│       └── expense/              # 消费/预算 (新增)
│           └── v1/route.ts           # CRUD (add/list/set_budget/summary)
│
├── lib/
│   ├── telegram.ts               # Telegram Client 池
│   ├── prisma.ts                 # Prisma Client (新增)
│   ├── services/
│   │   ├── chat.ts               # 聊天数据聚合
│   │   ├── home.ts               # 首页数据
│   │   ├── profile.ts            # 个人资料
│   │   ├── telegram.ts           # Telegram API 封装
│   │   ├── ai.ts                 # Gemini API 封装 (新增)
│   │   ├── ai-tools.ts           # Tool Registry (新增)
│   │   ├── weather.ts            # OpenWeatherMap (新增)
│   │   ├── budget.ts             # 预算计算 (新增)
│   │   ├── push.ts               # 推送服务 (新增)
│   │   ├── embedding.ts          # Embedding (新增)
│   │   ├── vector-store.ts       # 向量存储 (新增)
│   │   └── rag.ts                # RAG 流水线 (新增)
│   ├── services/tools/           # Agent 工具 (新增)
│   │   ├── search-attractions.ts
│   │   ├── plan-route.ts
│   │   ├── get-map-route.ts
│   │   ├── recognize-payment.ts
│   │   └── add-expense.ts
│   ├── agents/                   # 多 Agent (新增)
│   │   ├── registry.ts
│   │   ├── router.ts
│   │   ├── orchestrator.ts
│   │   ├── travel-agent.ts
│   │   ├── budget-agent.ts
│   │   ├── advice-agent.ts
│   │   └── weather-agent.ts
│   └── scheduler/                # 定时任务 (新增)
│       ├── index.ts
│       └── jobs/daily-briefing.ts
│
├── prisma/                       # Prisma (新增)
│   └── schema.prisma
│
└── types/
```

---

## 4. API 端点清单

### 已有端点

| 端点                             | 方法 | 用途          |
| -------------------------------- | ---- | ------------- |
| `/piko/homepage/summary/v1`      | POST | 首页数据      |
| `/piko/profile/detail/v1`        | POST | 个人资料      |
| `/piko/chat/list/v1`             | POST | 聊天列表      |
| `/piko/chat/detail/v1`           | POST | 聊天详情      |
| `/piko/telegram/auth/v1`         | POST | Telegram 认证 |
| `/piko/telegram/send-message/v1` | POST | 发送消息      |
| `/piko/telegram/get-dialogs/v1`  | POST | 获取对话      |
| `/piko/telegram/get-messages/v1` | POST | 获取消息      |
| `/piko/telegram/avatar/v1`       | GET  | 头像代理      |
| `/piko/telegram/media/v1`        | GET  | 媒体下载      |

### 新增端点（Agent 功能，收敛为 3 个新端点 + 2 个扩展）

| 端点                        | 方法       | 用途                                                                       |
| --------------------------- | ---------- | -------------------------------------------------------------------------- |
| `/piko/ai/chat/v1`          | POST (SSE) | AI 流式聊天（独立，因为 SSE 协议特殊）                                     |
| `/piko/ai/action/v1`        | POST       | 统一 AI 动作：`{ action: "recognize" \| "advice" \| "search", payload }`   |
| `/piko/expense/v1`          | POST       | 消费/预算 CRUD：`{ action: "add" \| "list" \| "set_budget" \| "summary" }` |
| `/piko/homepage/summary/v1` | POST       | **扩展已有**：聚合返回预算 + 天气 + AI 建议 + 今日消费                     |
| `/piko/profile/detail/v1`   | POST       | **扩展已有**：支持 pushToken 注册（body 中加 pushToken 字段）              |

---

## 5. 认证流程

```
手机号 → sendCode → 验证码 → signIn → (可选 2FA → checkPassword) → session string
                                                                         ↓
                                               存储: expo-secure-store (native) / localStorage (web)
                                                                         ↓
                                               每次 API 请求在 body 中携带 session
```

关键文件: `common/hooks/useAuth.ts`、`backend/lib/telegram.ts`

---

## 6. Tamagui Token 速查

### 颜色

| Token         | 用途     | 示例         |
| ------------- | -------- | ------------ |
| `$color`      | 主文本   | 标题、正文   |
| `$gray10`     | 次要文本 | 时间戳、说明 |
| `$gray4`      | 卡片背景 | 卡片、气泡   |
| `$background` | 页面背景 | 全屏背景     |
| `$blue9`      | 强调色   | 按钮、链接   |

### 间距

| Token | 大约值 | 用途     |
| ----- | ------ | -------- |
| `$1`  | 4px    | 极小间距 |
| `$2`  | 8px    | 紧凑间距 |
| `$3`  | 12px   | 常用间距 |
| `$4`  | 16px   | 标准间距 |
| `$6`  | 24px   | 宽松间距 |
| `$8`  | 32px   | 大间距   |

---

## 7. 环境变量

```env
# backend/.env.local
TELEGRAM_API_ID=xxx
TELEGRAM_API_HASH=xxx
GEMINI_API_KEY=xxx              # Google Gemini
OPENWEATHER_API_KEY=xxx         # OpenWeatherMap
AMAP_API_KEY=xxx                # 高德地图 (待申请)
DATABASE_URL=postgresql://...   # PostgreSQL
```

---

## 8. 现有代码可复用模式

| 模式               | 位置                                        | 复用于               |
| ------------------ | ------------------------------------------- | -------------------- |
| 数据 Hook 标准模式 | `pages/*/hooks/useFetchData.ts`             | 所有新页面的数据获取 |
| 副作用 Hook 模式   | `pages/chat-detail/hooks/useChatPolling.ts` | 实时更新场景         |
| 纯函数错误映射     | `common/components/page-status-view/`       | 所有 API 错误处理    |
| Slot 组合组件      | `common/components/`                        | 卡片、列表项等       |
| API 路由模式       | `backend/app/piko/telegram/*/route.ts`      | 所有新 API 端点      |
| 服务层模式         | `backend/lib/services/telegram.ts`          | 所有新后端服务       |
