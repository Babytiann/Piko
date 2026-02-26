/**
 * AI 路由聚合
 *   POST /chat/v1, /location/v1, /recognize/v1, /page_data/v1
 *   POST /conversation/list|create|detail|save-interrupted|delete/v1
 */

import { Hono } from 'hono';
import { chatRoutes } from './chat';
import { locationRoutes } from './location';
import { recognizeRoutes } from './recognize';
import { pageDataRoutes } from './page-data';
import { conversationRoutes } from './conversation';

export const aiRoutes = new Hono();

aiRoutes.route('/', chatRoutes);
aiRoutes.route('/', locationRoutes);
aiRoutes.route('/', recognizeRoutes);
aiRoutes.route('/', pageDataRoutes);
aiRoutes.route('/', conversationRoutes);
