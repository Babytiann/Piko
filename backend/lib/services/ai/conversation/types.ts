/** API 返回的对话列表项（字段 snake_case） */
export interface ConversationListItem {
  id: string;
  title: string;
  updated_at: string;
  message_count: number;
}

/** API 返回的对话详情（字段 snake_case） */
export interface ConversationDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: {
    id: string;
    role: 'user' | 'model';
    content: string;
    tool_calls: unknown;
    created_at: string;
  }[];
}
