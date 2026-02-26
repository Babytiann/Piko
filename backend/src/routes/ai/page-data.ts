import { Hono } from 'hono';
import { getSessionOrNull } from '../../../lib/auth.js';
import { LoginStatus, AiPageData } from '../../../types/ai.js';

export const pageDataRoutes = new Hono();

pageDataRoutes.post('/page_data/v1', async (c) => {
  const session = await getSessionOrNull(c.req.raw);
  const data: AiPageData = {
    login_status: session ? LoginStatus.LOGGED_IN : LoginStatus.LOGGED_OUT,
    header_title: 'AI 助手',
    empty_title: 'Hi，我是 Piko AI',
    empty_subtitle: '问我任何问题，我会尽力帮你解答。',
    input_placeholder: '问我任何问题...',
    drawer_title: '历史对话',
    new_chat_label: '新对话',
    login_prompt_title: '请使用 Apple 登录',
    login_prompt_desc: '登录后即可使用 AI 聊天、对话历史等功能。',
    login_prompt_btn: '去登录',
  };
  return c.json({ success: true, data });
});
