import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { ScrollView, Text as RNText, View as RNView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme, useThemeName } from 'tamagui';

import { MONO_FONT, TABLE_FONT_SIZE, CELL_PAD_H } from '../consts';
import type { MarkdownSegment } from '../types';
import type { MergeCell } from '../utils';
import {
  calcColumnWidths,
  computeMergeMap,
  renderInlineMarkdown,
  sanitizeStreamingMarkdown,
  splitMarkdownSegments,
} from '../utils';

interface Props {
  content: string;
  isStreaming?: boolean;
}

function MarkdownTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}): ReactNode {
  const theme = useTheme();
  const borderColor = theme.gray6.val;
  const headerBg = theme.gray3.val;
  const textColor = theme.color.val;
  const codeBg = theme.gray4.val;

  const colWidths = useMemo(
    () => calcColumnWidths(headers, rows),
    [headers, rows],
  );

  const mergeMap = useMemo(() => computeMergeMap(rows), [rows]);

  const renderCell = (
    text: string,
    ri: number,
    ci: number,
    isHeader: boolean,
    merge?: MergeCell,
  ): ReactNode => {
    const isStart = merge && merge.rowspan > 1;
    const isMid = merge?.hidden ?? false;
    const isLast =
      isMid && (ri === rows.length - 1 || !mergeMap[ri + 1]?.[ci]?.hidden);
    const hideBottom = isStart || (isMid && !isLast);

    return (
      <RNView
        key={ci}
        style={{
          width: colWidths[ci],
          paddingHorizontal: CELL_PAD_H,
          paddingVertical: 8,
          borderWidth: 0.5,
          borderColor,
          borderBottomColor: hideBottom ? 'transparent' : borderColor,
          borderTopColor: isMid ? 'transparent' : borderColor,
          justifyContent: 'center',
        }}
      >
        {isMid ? null : (
          <RNText
            style={{
              fontSize: TABLE_FONT_SIZE,
              lineHeight: 20,
              color: textColor,
              fontWeight: isHeader ? '600' : '400',
            }}
          >
            {renderInlineMarkdown(text, codeBg)}
          </RNText>
        )}
      </RNView>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={{ marginVertical: 8 }}
    >
      <RNView
        style={{
          borderWidth: 1,
          borderColor,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <RNView style={{ flexDirection: 'row', backgroundColor: headerBg }}>
          {headers.map((h, ci) => renderCell(h, -1, ci, true))}
        </RNView>
        {rows.map((row, ri) => (
          <RNView key={ri} style={{ flexDirection: 'row' }}>
            {headers.map((_, ci) =>
              renderCell(row[ci] ?? '', ri, ci, false, mergeMap[ri]?.[ci]),
            )}
          </RNView>
        ))}
      </RNView>
    </ScrollView>
  );
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
    };
  }, [themeName]);

  const displayContent = isStreaming
    ? sanitizeStreamingMarkdown(content)
    : content;

  const segments = useMemo(
    () => splitMarkdownSegments(displayContent),
    [displayContent],
  );

  return (
    <>
      {segments.map((seg, idx) =>
        seg.type === 'table' ? (
          <MarkdownTable key={idx} headers={seg.headers} rows={seg.rows} />
        ) : (
          <Markdown key={idx} style={markdownStyles}>
            {seg.content}
          </Markdown>
        ),
      )}
    </>
  );
}
