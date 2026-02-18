const UNCLOSED_PAIRS: Array<{ match: RegExp; suffix: string }> = [
  { match: /```/g, suffix: '\n```' },
  { match: /`/g, suffix: '`' },
  { match: /\*\*/g, suffix: '**' },
  { match: /(?<!\*)\*(?!\*)/g, suffix: '*' },
  { match: /~~/g, suffix: '~~' },
];

/**
 * 流式输出时，文本可能在 Markdown 语法标记中间被截断，
 * 导致 react-native-markdown-display 解析失败或渲染异常。
 * 这个函数修复所有常见的未闭合语法。
 */
export function sanitizeStreamingMarkdown(text: string): string {
  let result = text;

  UNCLOSED_PAIRS.forEach(({ match, suffix }) => {
    const count = (result.match(match) || []).length;
    count % 2 !== 0 && (result += suffix);
  });

  result = result.replace(/\[([^\]]*)\]\([^)]*$/, '$1');
  result = result.replace(/\[([^\]]*)$/, '$1');

  return result;
}
