import type { RecognizeResult } from '@/types/expense';

export interface CreateExpenseInput {
  amount: number;
  merchant?: string;
  category: string;
  date: string;
  items?: string[];
  confidence?: number;
  source: 'camera' | 'album' | 'manual';
  imageBase64?: string;
  imageMimeType?: string;
  rawResult?: RecognizeResult;
}

export interface ExpenseListParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}
