/**
 * Telegram 路由聚合
 *   POST /auth/v1, /unbind/v1, /text_detail/v1
 *   POST /get-dialogs/v1, /get-messages/v1, /send-message/v1
 *   GET  /media/v1, /avatar/v1
 */

import { Hono } from 'hono';
import { authRoutes } from './auth';
import { accountRoutes } from './account';
import { dialogsRoutes } from './dialogs';
import { messagesRoutes } from './messages';
import { mediaRoutes } from './media';

export const telegramRoutes = new Hono();

telegramRoutes.route('/', authRoutes);
telegramRoutes.route('/', accountRoutes);
telegramRoutes.route('/', dialogsRoutes);
telegramRoutes.route('/', messagesRoutes);
telegramRoutes.route('/', mediaRoutes);
