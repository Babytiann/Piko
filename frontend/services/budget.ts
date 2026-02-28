import type { ApiResponse } from '@/common/typings/api';
import { fetch } from '@/services';

export interface SetBudgetResponse {
  monthly_budget: number;
  weekly_budget: number;
}

/** 设置用户月预算（后端自动计算周预算）。 */
export function setBudget(
  monthlyBudget: number,
): Promise<ApiResponse<SetBudgetResponse>> {
  return fetch<Record<string, never>, SetBudgetResponse>({
    method: 'POST',
    path: 'budget/set/v1',
    body: { monthly_budget: monthlyBudget },
  });
}
