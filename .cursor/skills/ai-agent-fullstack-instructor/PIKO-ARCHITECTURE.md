# Piko 项目架构速查

供 AI 教学时快速参考项目结构、API 端点、文件职责。

---

## 1. 项目概览

| 层       | 技术                                                | 路径                      |
| -------- | --------------------------------------------------- | ------------------------- |
| 前端     | Expo 54 / React Native 0.81 / Tamagui / Expo Router | `frontend/`               |
| 后端     | Next.js 16 App Router / TypeScript                  | `backend/`                |
| 数据库   | PostgreSQL (Neon) + Prisma ORM                      | `backend/prisma/`         |
| 对象存储 | Cloudflare R2 (S3 兼容)                             | `backend/lib/r2.ts`       |
| 认证     | Mock Auth → Apple Sign In + Next-Auth v5            | `backend/lib/auth.ts`     |
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
│       ├── profile/
│       │   ├── detail/v1/route.ts
│       │   ├── update/v1/route.ts        # 更新昵称/头像 (新增)
│       │   └── avatar/v1/route.ts        # 头像上传 (新增)
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
│       │   ├── text_detail/v1/route.ts
│       │   └── unbind/v1/route.ts
│       ├── ai/                   # AI 相关
│       │   ├── chat/v1/route.ts          # AI 流式聊天 (SSE)
│       │   ├── page_data/v1/route.ts   # 页面文案
│       │   ├── location/v1/route.ts      # 位置回传
│       │   ├── recognize/v1/route.ts     # 账单识别
│       │   └── conversation/             # AI 对话管理 (新增)
│       │       ├── list/v1/route.ts
│       │       ├── create/v1/route.ts
│       │       ├── detail/v1/route.ts
│       │       └── delete/v1/route.ts
│       ├── expense/              # 消费记录 (新增)
│       │   ├── upload/v1/route.ts        # 图片上传 + 识别
│       │   ├── list/v1/route.ts          # 历史查询
│       │   └── detail/v1/route.ts        # 单条详情
│       └── auth/                 # 认证 (新增，待接入 Apple Sign In)
│           └── apple/v1/route.ts         # Apple 登录 (TODO)
│
├── lib/
│   ├── telegram.ts               # Telegram Client 池
│   ├── prisma.ts                 # Prisma Client 单例 (新增)
│   ├── auth.ts                   # 统一认证 getUserId() (新增，当前 Mock)
│   ├── r2.ts                     # Cloudflare R2 客户端 (新增)
│   ├── services/
│   │   ├── chat.ts               # 聊天数据聚合
│   │   ├── home.ts               # 首页数据
│   │   ├── profile.ts            # 个人资料
│   │   ├── expense.ts            # 消费记录 CRUD (新增)
│   │   ├── ai-prompt.json        # AI 系统提示词
│   │   ├── ai-tools.ts           # Tool Registry
│   │   ├── location-bridge.ts    # 位置协作桥梁
│   │   ├── ai/                   # AI 服务层
│   │   │   ├── index.ts
│   │   │   ├── client.ts
│   │   │   ├── stream-chat.ts
│   │   │   ├── stream-chat-with-tools.ts
│   │   │   ├── stream-utils.ts
│   │   │   ├── types.ts
│   │   │   └── conversation.ts       # AI 对话 CRUD (新增)
│   │   ├── telegram/             # Telegram 服务层
│   │   │   ├── dialog.ts
│   │   │   ├── message.ts
│   │   │   ├── photo.ts
│   │   │   └── user-info.ts
│   │   ├── tools/                # Agent 工具
│   │   │   ├── get-weather.ts
│   │   │   ├── plan-route.ts
│   │   │   ├── get-user-location.ts
│   │   │   └── recognize-payment.ts
│   │   └── weather/              # 天气服务
│   ├── agents/                   # 多 Agent (新增，模块 7)
│   └── scheduler/                # 定时任务 (新增，模块 4)
│
├── prisma/                       # Prisma (新增)
│   └── schema.prisma             # 8 张表: User/Account/Session/VerificationToken/TelegramBinding/Expense/AiConversation/AiMessage
│
└── types/
    ├── ai.ts
    ├── base.ts
    ├── chat.ts
    ├── expense.ts
    ├── home.ts
    ├── profile.ts
    ├── telegram-login.ts
    └── telegram.ts
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

### 新增端点

| 端点                              | 方法       | 用途                             |
| --------------------------------- | ---------- | -------------------------------- |
| `/piko/ai/chat/v1`                | POST (SSE) | AI 流式聊天（带 conversationId） |
| `/piko/ai/page_data/v1`           | POST       | AI 页面文案                      |
| `/piko/ai/location/v1`            | POST       | 前端回传位置                     |
| `/piko/ai/recognize/v1`           | POST       | Gemini Vision 账单识别           |
| `/piko/ai/conversation/list/v1`   | POST       | AI 对话列表 (新增)               |
| `/piko/ai/conversation/create/v1` | POST       | 新建 AI 对话 (新增)              |
| `/piko/ai/conversation/detail/v1` | POST       | AI 对话详情/历史消息 (新增)      |
| `/piko/ai/conversation/delete/v1` | POST       | 删除 AI 对话 (新增)              |
| `/piko/expense/upload/v1`         | POST       | 账单图片上传 + 识别 (新增)       |
| `/piko/expense/list/v1`           | POST       | 消费历史查询 (新增)              |
| `/piko/expense/detail/v1`         | POST       | 单条消费详情 (新增)              |
| `/piko/profile/update/v1`         | POST       | 更新昵称/头像 (新增)             |
| `/piko/profile/avatar/v1`         | POST       | 头像上传 (新增)                  |
| `/piko/auth/apple/v1`             | POST       | Apple 登录 (TODO，待接入)        |

---

## 5. 认证流程

**当前阶段：Mock Auth**

```
所有受保护路由 → getUserId(request)
                           │
                           ├─ 检查 header X-Mock-User-Id → 有则返回
                           └─ 无则返回默认 "mock-user-001"
```

**未来阶段：Apple Sign In + Next-Auth v5**

```
前端 expo-apple-authentication → identityToken
  → POST /piko/auth/apple/v1 → 后端验证 + 创建/查找 User → 返回 JWT
  → JWT 存入 expo-secure-store
  → 每次请求携带 Authorization: Bearer <jwt>
  → getUserId(request) 从 JWT 解析真实 userId
```

**切换点唯一**：`backend/lib/auth.ts` — 改一个函数即可完成切换

**Telegram 登录**（保留，作为绑定功能）:

```
手机号 → sendCode → 验证码 → signIn → (可选 2FA → checkPassword) → session string
                                                                         ↓
                                               绑定成功后写入 TelegramBinding 表
                                               session string 存 DB，不再存前端
```

关键文件: `backend/lib/auth.ts`、`common/hooks/useAuth.ts`、`backend/lib/telegram.ts`

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

# PostgreSQL (Neon)
DATABASE_URL=postgresql://...   # Neon 连接串

# 认证 (Apple Sign In 接入后启用)
AUTH_SECRET=xxx                 # Next-Auth JWT 签名密钥
APPLE_ID=xxx                    # Apple Services ID (TODO)
APPLE_TEAM_ID=xxx               # (TODO)
APPLE_KEY_ID=xxx                # (TODO)
APPLE_SECRET=xxx                # (TODO)

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=piko-uploads
R2_PUBLIC_URL=https://pub-xxx.r2.dev
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
