import { Hono } from 'hono';
import { getUserId, UnauthorizedError } from '../../../lib/auth.js';
import {
  createConversation,
  listConversations,
  getConversationWithMessages,
  deleteConversation,
  upsertModelMessage,
} from '../../../lib/services/ai/conversation/index.js';

export const conversationRoutes = new Hono();

conversationRoutes.post('/conversation/list/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const conversations = await listConversations(userId);
    return c.json({ success: true, data: conversations });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to list conversations';
    console.error('[Conversation list] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

conversationRoutes.post('/conversation/create/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as { title?: string };
    const conversation = await createConversation(userId, body.title);
    return c.json({
      success: true,
      data: {
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.createdAt.toISOString(),
      },
    });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to create conversation';
    console.error('[Conversation create] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

conversationRoutes.post('/conversation/detail/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as { conversation_id: string };

    if (!body.conversation_id) {
      return c.json(
        { success: false, error: 'conversation_id is required' },
        400,
      );
    }

    const detail = await getConversationWithMessages(
      userId,
      body.conversation_id,
    );

    if (!detail) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    return c.json({ success: true, data: detail });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to get conversation detail';
    console.error('[Conversation detail] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

conversationRoutes.post('/conversation/save-interrupted/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as {
      conversation_id: string;
      message_id: string;
      content: string;
    };

    if (!body.conversation_id || !body.message_id) {
      return c.json(
        {
          success: false,
          error: 'conversation_id and message_id are required',
        },
        400,
      );
    }

    await upsertModelMessage(
      body.conversation_id,
      body.message_id,
      body.content,
    );

    console.log(
      `[Conversation save-interrupted] done (user=${userId}, conversation=${body.conversation_id}, message=${body.message_id})`,
    );

    return c.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to save interrupted message';
    console.error('[Conversation save-interrupted] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

conversationRoutes.post('/conversation/delete/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as { conversation_id: string };

    if (!body.conversation_id) {
      return c.json(
        { success: false, error: 'conversation_id is required' },
        400,
      );
    }

    const conversationId = body.conversation_id;
    console.log(
      `[Conversation delete] accepted (user=${userId}, conversation=${conversationId})`,
    );

    const deleted = await deleteConversation(userId, conversationId);
    console.log(
      `[Conversation delete] done (user=${userId}, conversation=${conversationId}, deleted=${deleted})`,
    );

    return c.json({ success: true, data: { deleted } });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to delete conversation';
    console.error('[Conversation delete] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
