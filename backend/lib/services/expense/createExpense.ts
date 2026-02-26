import { createId } from '@paralleldrive/cuid2';

import { db, expenses } from '../../../db/index.js';
import { uploadImage } from '../../r2.js';
import { CreateExpenseInput } from './types.js';

export async function createExpense(
  userId: string,
  input: CreateExpenseInput,
): Promise<{
  id: string;
  amount: number;
  merchant: string | null;
  category: string;
  date: Date;
  source: string;
  imageUrl: string | null;
  createdAt: Date;
}> {
  let imageUrl: string | null = null;
  let imageKey: string | null = null;

  if (input.imageBase64 && input.imageMimeType) {
    const buffer = Buffer.from(input.imageBase64, 'base64');
    const ext = input.imageMimeType.split('/')[1] ?? 'jpg';
    imageKey = `expenses/${userId}/${Date.now()}.${ext}`;
    imageUrl = await uploadImage(buffer, imageKey, input.imageMimeType);
  }

  const [expense] = await db
    .insert(expenses)
    .values({
      id: createId(),
      userId,
      amount: input.amount.toString(),
      merchant: input.merchant ?? null,
      category: input.category,
      date: new Date(input.date),
      items: input.items ?? null,
      confidence: input.confidence ?? null,
      source: input.source,
      imageUrl,
      imageKey,
      rawResult: input.rawResult ?? null,
      createdAt: new Date(),
    })
    .returning();

  if (!expense) {
    throw new Error('消费记录创建失败');
  }

  return {
    id: expense.id,
    amount: Number(expense.amount),
    merchant: expense.merchant,
    category: expense.category,
    date: expense.date,
    source: expense.source,
    imageUrl: expense.imageUrl,
    createdAt: expense.createdAt,
  };
}
