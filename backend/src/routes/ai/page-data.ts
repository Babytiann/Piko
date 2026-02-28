import { Hono } from 'hono';
import { getSessionOrNull } from '../../../lib/auth.js';
import { LoginStatus } from '../../../types/ai.js';
import type { AiPageData } from '../../../types/ai.js';

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
    time_just_now: '刚刚',
    time_minutes_ago: '{n} 分钟前',
    time_hours_ago: '{n} 小时前',
    time_days_ago: '{n} 天前',
    drawer_loading: '加载中...',
    drawer_empty: '暂无历史对话',
    drawer_delete_title: '确认删除',
    drawer_delete_desc: '删除后将无法恢复，是否继续？',
    drawer_delete_cancel: '取消',
    drawer_delete_confirm: '删除',
    drawer_message_count: '{n} 条消息',
    tooltip_copy: '复制',
    bubble_grant_location: '点击授权位置权限',
    nav_amap_title: '在高德地图中导航',
    nav_google_title: '在 Google Maps 中导航',
    nav_open_hint: '点击打开 >',
  };
  return c.json({ success: true, data });
});
