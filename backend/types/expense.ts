/** Types for expense recognition and recording. */

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

/** 所有可用的消费分类 */
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  '餐饮',
  '交通',
  '购物',
  '娱乐',
  '生活',
  '医疗',
  '教育',
  '其他',
];

/** 消费记录来源 */
export type ExpenseSource = 'camera' | 'album' | 'manual';

/** Gemini Vision 识别出的结构化消费数据 */
export interface RecognizeResult {
  /** 消费金额 */
  amount: number;
  /** 商家名称 */
  merchant: string;
  /** 消费分类 */
  category: ExpenseCategory;
  /** 消费日期 (ISO 8601) */
  date: string;
  /** 明细项清单（如有） */
  items?: string[];
  /** 识别置信度 0-1 */
  confidence: number;
}

/** POST /ai/recognize/v1 请求体 */
export interface RecognizeRequest {
  /** Base64 编码的图片数据 */
  image: string;
  /** 图片 MIME 类型 */
  mime_type: string;
}

/** POST /ai/recognize/v1 响应体 */
export interface RecognizeResponse {
  /** 识别结果 */
  result: RecognizeResult;
}
