import { eq } from 'drizzle-orm';

import { db, users } from '../../../db/index.js';

/**
 * 删除用户账号及所有关联数据。
 * 依赖 DB 外键 onDelete: 'cascade' 级联删除 account、session、telegram_binding、expense、user_budget、ai_conversation、ai_message。
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}
