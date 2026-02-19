import type { MarkdownSegment } from '../types';

const TABLE_LINE_RE = /^\|.+\|$/;
const SEPARATOR_RE = /^\|(\s*:?-+:?\s*\|)+\s*$/;
const PAREN_CELL_RE = /^\(.*\)$/;
const AMAP_NAV_RE =
  /^\[([^\]]+)\]\((https:\/\/uri\.amap\.com\/navigation\?[^)]+)\)$/;

function parseRow(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
}

/**
 * 将纯括号注释单元格（如 "(东京)"）合并到同列上方的锚点单元格中，
 * 原单元格清空，后续由 computeMergeMap 统一处理视觉合并。
 */
function mergeParenSubtitles(rows: string[][], colCount: number): void {
  for (let ci = 0; ci < colCount; ci++) {
    let anchorRi = -1;

    for (let ri = 0; ri < rows.length; ri++) {
      const cell = (rows[ri][ci] ?? '').trim();

      if (PAREN_CELL_RE.test(cell) && anchorRi >= 0) {
        rows[anchorRi][ci] = (rows[anchorRi][ci] ?? '') + '\n' + cell;
        rows[ri][ci] = '';
      } else if (cell !== '') {
        anchorRi = ri;
      }
    }
  }
}

export function splitMarkdownSegments(text: string): MarkdownSegment[] {
  const lines = text.split('\n');
  const segments: MarkdownSegment[] = [];
  let mdLines: string[] = [];
  let i = 0;

  const flushMd = (): void => {
    if (mdLines.length > 0) {
      segments.push({ type: 'markdown', content: mdLines.join('\n') });
      mdLines = [];
    }
  };

  while (i < lines.length) {
    const cur = lines[i].trim();
    const next = i + 1 < lines.length ? lines[i + 1].trim() : '';

    const amapMatch = AMAP_NAV_RE.exec(cur);
    if (amapMatch) {
      flushMd();
      segments.push({
        type: 'amap-navigation',
        label: amapMatch[1],
        url: amapMatch[2],
      });
      i++;
    } else if (TABLE_LINE_RE.test(cur) && SEPARATOR_RE.test(next)) {
      flushMd();
      const headers = parseRow(cur);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && TABLE_LINE_RE.test(lines[i].trim())) {
        rows.push(parseRow(lines[i].trim()));
        i++;
      }
      mergeParenSubtitles(rows, headers.length);
      segments.push({ type: 'table', headers, rows });
    } else {
      mdLines.push(lines[i]);
      i++;
    }
  }

  flushMd();
  return segments;
}
