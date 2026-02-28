import { Hono } from 'hono';
import { getUserId, UnauthorizedError } from '../../lib/auth.js';
import { setUserBudget } from '../../lib/services/budget/index.js';

export const budgetRoutes = new Hono();

budgetRoutes.post('/set/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as { monthly_budget?: number };
    const monthlyBudget = body.monthly_budget;
    if (typeof monthlyBudget !== 'number' || monthlyBudget < 0) {
      return c.json(
        {
          success: false,
          error: 'monthly_budget must be a non-negative number',
        },
        400,
      );
    }
    const value = await setUserBudget(userId, monthlyBudget);
    return c.json({
      success: true,
      data: {
        monthly_budget: value.monthlyBudget,
        weekly_budget: value.weeklyBudget,
      },
    });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message = err instanceof Error ? err.message : 'Failed to set budget';
    console.error('budget/set error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
