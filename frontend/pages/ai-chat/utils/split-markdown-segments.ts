import type { MarkdownSegment } from '../types';

const TABLE_LINE_RE = /^\|.+\|$/;
const SEPARATOR_RE = /^\|(\s*:?-+:?\s*\|)+\s*$/;

function parseRow(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
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

    if (TABLE_LINE_RE.test(cur) && SEPARATOR_RE.test(next)) {
      flushMd();
      const headers = parseRow(cur);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && TABLE_LINE_RE.test(lines[i].trim())) {
        rows.push(parseRow(lines[i].trim()));
        i++;
      }
      segments.push({ type: 'table', headers, rows });
    } else {
      mdLines.push(lines[i]);
      i++;
    }
  }

  flushMd();
  return segments;
}
