import {
  pgTable,
  pgEnum,
  text,
  boolean,
  bigint,
  numeric,
  real,
  json,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const messageRoleEnum = pgEnum('message_role', ['USER', 'MODEL']);

// ---------------------------------------------------------------------------
// better-auth 标准表
// ---------------------------------------------------------------------------

export const users = pgTable('user', {
  /** cuid2，由应用层生成 */
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  /** 用户自定义昵称 */
  nickname: text('nickname'),
  /** 自定义头像（R2 URL） */
  avatarUrl: text('avatar_url'),
  /** 天气城市（为空则用自动定位或默认值） */
  weatherCity: text('weather_city'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verifications = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// 业务表 — TelegramBinding
// ---------------------------------------------------------------------------

export const telegramBindings = pgTable('telegram_binding', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  /** Telegram 用户 ID（64 位整数） */
  telegramUserId: bigint('telegram_user_id', { mode: 'bigint' })
    .notNull()
    .unique(),
  username: text('username'),
  firstName: text('first_name'),
  phone: text('phone'),
  /** GramJS session string，存完整字符串 */
  sessionString: text('session_string').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// 业务表 — Expense
// ---------------------------------------------------------------------------

export const expenses = pgTable(
  'expense',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** 消费金额，numeric(10,2) 精确小数 */
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    merchant: text('merchant'),
    category: text('category').notNull(),
    /** 消费日期（与 createdAt 分离，允许用户修改） */
    date: timestamp('date').notNull(),
    /** 消费明细 JSON 数组 */
    items: json('items').$type<string[]>(),
    /** Gemini 识别置信度 0~1 */
    confidence: real('confidence'),
    /** 来源：camera / album / manual */
    source: text('source').notNull(),
    /** R2 公开访问 URL */
    imageUrl: text('image_url'),
    /** R2 object key（用于删除） */
    imageKey: text('image_key'),
    /** Gemini 原始识别结果 */
    rawResult: json('raw_result'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    // 按用户 ID + 消费日期降序索引（分页查询主力索引）
    index('expense_user_date_idx').on(table.userId, table.date),
  ],
);

// ---------------------------------------------------------------------------
// 业务表 — UserBudget（用户预算，一人一条；月预算为用户设置值，周预算由系统按月均分）
// ---------------------------------------------------------------------------

export const userBudgets = pgTable('user_budget', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  /** 月预算金额（用户设置） */
  monthlyBudget: numeric('monthly_budget', {
    precision: 12,
    scale: 2,
  }).notNull(),
  /** 周预算金额（系统按 monthlyBudget / 当月周数 计算） */
  weeklyBudget: numeric('weekly_budget', { precision: 12, scale: 2 }).notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// 业务表 — AiConversation
// ---------------------------------------------------------------------------

export const aiConversations = pgTable(
  'ai_conversation',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default('新对话'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // 按用户 ID + 最后更新时间降序索引
    index('ai_conversation_user_updated_idx').on(table.userId, table.updatedAt),
  ],
);

// ---------------------------------------------------------------------------
// 业务表 — AiMessage
// ---------------------------------------------------------------------------

export const aiMessages = pgTable(
  'ai_message',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => aiConversations.id, { onDelete: 'cascade' }),
    role: messageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    /** 工具调用记录 [{tool, args, message, success}] */
    toolCalls: json('tool_calls'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    // 按对话 ID + 创建时间升序索引（消息时间线查询）
    index('ai_message_conv_created_idx').on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Relations — 关系定义（Drizzle 查询 API 使用）
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  telegramBinding: one(telegramBindings, {
    fields: [users.id],
    references: [telegramBindings.userId],
  }),
  expenses: many(expenses),
  userBudget: one(userBudgets),
  aiConversations: many(aiConversations),
}));

export const userBudgetsRelations = relations(userBudgets, ({ one }) => ({
  user: one(users, {
    fields: [userBudgets.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const telegramBindingsRelations = relations(
  telegramBindings,
  ({ one }) => ({
    user: one(users, {
      fields: [telegramBindings.userId],
      references: [users.id],
    }),
  }),
);

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

export const aiConversationsRelations = relations(
  aiConversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [aiConversations.userId],
      references: [users.id],
    }),
    messages: many(aiMessages),
  }),
);

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));
