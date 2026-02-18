import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Platform, ScrollView, View as RNView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme, useThemeName } from 'tamagui';

interface Props {
  content: string;
  isStreaming?: boolean;
}

const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

/**
 * 流式输出时，文本可能在 Markdown 语法标记中间被截断，
 * 导致 react-native-markdown-display 解析失败或渲染异常。
 * 这个函数修复所有常见的未闭合语法。
 */
function sanitizeStreamingMarkdown(text: string): string {
  let result = text;

  // 1. 未闭合的代码块 ```
  const fenceCount = (result.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) {
    result += '\n```';
  }

  // 2. 未闭合的行内代码 `
  //    排除已闭合的 `` 对和 ``` 块后，检查剩余的孤立 `
  const withoutFences = result.replace(/```[\s\S]*?```/g, '');
  const backtickCount = (withoutFences.match(/`/g) || []).length;
  if (backtickCount % 2 !== 0) {
    result += '`';
  }

  // 3. 未闭合的粗体 ** （检查最后一行，避免跨段落误判）
  const lastLine = result.split('\n').pop() ?? '';
  const boldCount = (lastLine.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) {
    result += '**';
  }

  // 4. 未闭合的斜体 *（排除 ** 之后，检查孤立的 *）
  const lastLineNoBold = lastLine.replace(/\*\*/g, '');
  const italicCount = (lastLineNoBold.match(/\*/g) || []).length;
  if (italicCount % 2 !== 0) {
    result += '*';
  }

  // 5. 未闭合的删除线 ~~
  const strikeCount = (lastLine.match(/~~/g) || []).length;
  if (strikeCount % 2 !== 0) {
    result += '~~';
  }

  // 6. 末尾截断的链接语法 [text](url — 移除不完整的链接标记
  //    匹配 "[已有文字](" 但没有闭合的 ")" 的情况
  result = result.replace(/\[([^\]]*)\]\([^)]*$/, '$1');
  //    匹配只有 "[文字" 没有闭合 "]" 的情况
  result = result.replace(/\[([^\]]*)$/, '$1');

  return result;
}

export default function AiChatMarkdown({
  content,
  isStreaming,
}: Props): ReactNode {
  const theme = useTheme();
  const themeName = useThemeName();

  const markdownStyles = useMemo(() => {
    const textColor = theme.color.val;
    const codeBg = theme.gray4.val;
    const codeColor = theme.red10.val;
    const subtleBg = theme.gray3.val;
    const borderColor = theme.gray6.val;
    const accentColor = theme.blue10.val;

    return {
      body: { fontSize: 15, lineHeight: 22, color: textColor },
      heading1: {
        fontSize: 22,
        fontWeight: '700' as const,
        marginTop: 12,
        marginBottom: 4,
        color: textColor,
      },
      heading2: {
        fontSize: 19,
        fontWeight: '700' as const,
        marginTop: 10,
        marginBottom: 4,
        color: textColor,
      },
      heading3: {
        fontSize: 17,
        fontWeight: '600' as const,
        marginTop: 8,
        marginBottom: 4,
        color: textColor,
      },
      paragraph: { marginTop: 0, marginBottom: 8 },
      strong: { fontWeight: '600' as const },
      em: { fontStyle: 'italic' as const },
      s: { textDecorationLine: 'line-through' as const },
      code_inline: {
        backgroundColor: codeBg,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 14,
        fontFamily: MONO_FONT,
        color: codeColor,
      },
      fence: {
        backgroundColor: '#1A1A2E',
        color: '#D4D4D4',
        padding: 12,
        borderRadius: 8,
        fontSize: 13,
        fontFamily: MONO_FONT,
        marginVertical: 8,
      },
      code_block: {
        backgroundColor: '#1A1A2E',
        color: '#D4D4D4',
        padding: 12,
        borderRadius: 8,
        fontSize: 13,
        fontFamily: MONO_FONT,
        marginVertical: 8,
      },
      blockquote: {
        backgroundColor: subtleBg,
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
        paddingLeft: 12,
        paddingVertical: 4,
        marginVertical: 8,
      },
      bullet_list: { marginVertical: 4 },
      ordered_list: { marginVertical: 4 },
      list_item: { marginVertical: 2 },
      hr: { backgroundColor: borderColor, height: 1, marginVertical: 12 },
      link: { color: accentColor, textDecorationLine: 'underline' as const },
      table: {
        borderWidth: 1,
        borderColor: borderColor,
        borderRadius: 4,
        marginVertical: 8,
      },
      thead: { backgroundColor: subtleBg },
      th: {
        padding: 8,
        fontWeight: '600' as const,
        borderWidth: 0.5,
        borderColor: borderColor,
      },
      td: { padding: 8, borderWidth: 0.5, borderColor: borderColor },
    };
  }, [themeName]);

  const displayContent = isStreaming
    ? sanitizeStreamingMarkdown(content)
    : content;

  const rules = useMemo(
    () => ({
      table: (
        node: { key?: string },
        children: ReactNode,
        _parent: unknown,
        styles: Record<string, object>,
      ) => (
        <ScrollView
          key={node.key}
          horizontal
          showsHorizontalScrollIndicator
          style={{ marginVertical: 8 }}
        >
          <RNView style={[styles.table, { marginVertical: 0 }]}>
            {children}
          </RNView>
        </ScrollView>
      ),
    }),
    [],
  );

  return (
    <Markdown style={markdownStyles} rules={rules}>
      {displayContent}
    </Markdown>
  );
}
