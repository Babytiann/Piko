import { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { accountRoutes } from './account.js';
import { dialogsRoutes } from './dialogs.js';
import { messagesRoutes } from './messages.js';
import { mediaRoutes } from './media.js';

export const telegramRoutes = new Hono();

telegramRoutes.route('/', authRoutes);
telegramRoutes.route('/', accountRoutes);
telegramRoutes.route('/', dialogsRoutes);
telegramRoutes.route('/', messagesRoutes);
telegramRoutes.route('/', mediaRoutes);
