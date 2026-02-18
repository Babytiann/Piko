import { TABLE_FONT_SIZE, CELL_PAD_H, MIN_COL_W } from '../consts';

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/~~(.+?)~~/g, '$1');
}

function estimateTextWidth(text: string): number {
  const plain = stripInlineMarkdown(text);
  let w = 0;
  for (const ch of plain) {
    w += ch.charCodeAt(0) > 0x2e80 ? TABLE_FONT_SIZE : TABLE_FONT_SIZE * 0.55;
  }
  return w;
}

export function calcColumnWidths(
  headers: string[],
  rows: string[][],
): number[] {
  return headers.map((h, ci) => {
    const hw = estimateTextWidth(h);
    const maxCw = rows.reduce(
      (m, r) => Math.max(m, estimateTextWidth(r[ci] ?? '')),
      0,
    );
    return Math.max(MIN_COL_W, Math.ceil(Math.max(hw, maxCw)) + CELL_PAD_H * 2);
  });
}
