/**
 * 票据/截图识别工具 — Gemini Vision 多模态识别。
 *
 * 接收 base64 图片，利用 Gemini 的视觉能力提取结构化消费数据。
 * 这是 Tool Calling 的延伸：输入从文本变成了图片。
 */

import { generateText } from 'ai';
import { getModel } from '../ai/client';
import type { RecognizeResult, ExpenseCategory } from '@/types/expense';
import { EXPENSE_CATEGORIES } from '@/types/expense';

// ---------------------------------------------------------------------------
// Prompt — 告诉 Gemini 如何识别消费信息
// ---------------------------------------------------------------------------

const RECOGNIZE_PROMPT = `你是一个消费票据识别专家。请从这张图片中提取消费信息。

要求：
1. 识别总金额（如有多项，取合计/总计/实付金额）
2. 识别商家名称
3. 识别消费日期（如无法识别，使用今天的日期）
4. 自动归类到以下分类之一：${EXPENSE_CATEGORIES.join('、')}
5. 如有明细项，列出每一项

请严格按以下 JSON 格式返回（不要包含 markdown 代码块标记）：
{
  "amount": 数字,
  "merchant": "商家名称",
  "category": "分类",
  "date": "YYYY-MM-DD",
  "items": ["明细1", "明细2"],
  "confidence": 0到1之间的数字，表示你对识别结果的确信程度
}

如果图片不是消费相关的票据/截图，返回：
{
  "amount": 0,
  "merchant": "未识别",
  "category": "其他",
  "date": "今天日期",
  "items": [],
  "confidence": 0
}`;

// ---------------------------------------------------------------------------
// 核心识别函数
// ---------------------------------------------------------------------------

export async function recognizePayment(
  imageBase64: string,
  mimeType: string,
): Promise<RecognizeResult> {
  const { text } = await generateText({
    model: getModel(),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: imageBase64,
            mediaType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
          },
          { type: 'text', text: RECOGNIZE_PROMPT },
        ],
      },
    ],
  });

  // 清理可能的 markdown 代码块包裹
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed: unknown = JSON.parse(cleaned);

  return validateRecognizeResult(parsed);
}

// ---------------------------------------------------------------------------
// 结果校验 — 不用 as T，用 type guard
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateRecognizeResult(raw: unknown): RecognizeResult {
  if (!isRecord(raw)) {
    throw new Error('识别结果格式无效');
  }

  const amount = typeof raw.amount === 'number' ? raw.amount : 0;
  const merchant = typeof raw.merchant === 'string' ? raw.merchant : '未识别';
  const date =
    typeof raw.date === 'string'
      ? raw.date
      : new Date().toISOString().slice(0, 10);
  const confidence =
    typeof raw.confidence === 'number'
      ? Math.max(0, Math.min(1, raw.confidence))
      : 0;

  const categoryRaw = typeof raw.category === 'string' ? raw.category : '其他';
  const category: ExpenseCategory = EXPENSE_CATEGORIES.includes(
    categoryRaw as ExpenseCategory,
  )
    ? (categoryRaw as ExpenseCategory)
    : '其他';

  const items = Array.isArray(raw.items)
    ? raw.items.filter((item): item is string => typeof item === 'string')
    : undefined;

  return { amount, merchant, category, date, items, confidence };
}
