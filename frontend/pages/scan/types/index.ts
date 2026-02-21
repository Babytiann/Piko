/** 消费分类 */
export type ExpenseCategory =
  | '餐饮'
  | '交通'
  | '购物'
  | '娱乐'
  | '生活'
  | '医疗'
  | '教育'
  | '其他';

/** 消费记录来源 */
export type ExpenseSource = 'camera' | 'album' | 'manual';

/** AI 识别出的结构化消费数据 */
export interface RecognizeResult {
  amount: number;
  merchant: string;
  category: ExpenseCategory;
  date: string;
  items?: string[];
  confidence: number;
}

/** 一条消费记录（前端本地状态） */
export interface ExpenseRecord {
  id: string;
  amount: number;
  merchant: string;
  category: ExpenseCategory;
  date: string;
  items?: string[];
  source: ExpenseSource;
  createdAt: number;
}

/** 记账页面的流程阶段 */
export type ScanPhase =
  | 'camera'
  | 'preview'
  | 'recognizing'
  | 'result'
  | 'manual';
