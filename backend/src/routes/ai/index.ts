import { Hono } from 'hono';
import { chatRoutes } from './chat.js';
import { locationRoutes } from './location.js';
import { recognizeRoutes } from './recognize.js';
import { pageDataRoutes } from './page-data.js';
import { conversationRoutes } from './conversation.js';

export const aiRoutes = new Hono();

aiRoutes.route('/', chatRoutes);
aiRoutes.route('/', locationRoutes);
aiRoutes.route('/', recognizeRoutes);
aiRoutes.route('/', pageDataRoutes);
aiRoutes.route('/', conversationRoutes);
