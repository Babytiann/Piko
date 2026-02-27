import type { ApiResponse } from '@/common/typings/api';
import { fetch } from '@/services';

export interface SetBudgetResponse {
  weekly_budget: number;
}

/** 设置用户周预算。 */
export function setBudget(
  weeklyBudget: number,
): Promise<ApiResponse<SetBudgetResponse>> {
  return fetch<Record<string, never>, SetBudgetResponse>({
    method: 'POST',
    path: 'budget/set/v1',
    body: { weekly_budget: weeklyBudget },
  });
}
