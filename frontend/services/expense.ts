import type { ApiResponse } from '@/common/typings/api';
import { fetch } from '@/services';

export interface ExpenseDetail {
  id: string;
  amount: number;
  merchant: string | null;
  category: string;
  date: string;
  items: string[] | null;
  source: string;
  imageUrl: string | null;
  confidence: number | null;
  rawResult: unknown;
  createdAt: string;
}

export function fetchExpenseDetail(
  id: string,
): Promise<ApiResponse<ExpenseDetail>> {
  return fetch<{ id: string }, ExpenseDetail>({
    method: 'POST',
    path: 'expense/detail/v1',
    body: { id },
  });
}

export function deleteExpenseApi(id: string): Promise<ApiResponse<void>> {
  return fetch<{ id: string }, void>({
    method: 'POST',
    path: 'expense/delete/v1',
    body: { id },
  });
}
