import { useMemo } from 'react';
import type { ReactNode } from 'react';
import Markdown from 'react-native-markdown-display';
import { useTheme, useThemeName } from 'tamagui';

import { MONO_FONT } from '../../consts';
import { sanitizeStreamingMarkdown, splitMarkdownSegments } from '../../utils';
import MarkdownTable from './markdown-table';
import NavigationCard from './navigation-card';

interface Props {
  content: string;
  isStreaming?: boolean;
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
    const accentColor = theme.primary.val;

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
        ) : seg.type === 'amap-navigation' ? (
          <NavigationCard
            key={idx}
            variant="amap"
            url={seg.url}
            label={seg.label}
          />
        ) : seg.type === 'google-maps-navigation' ? (
          <NavigationCard
            key={idx}
            variant="google-maps"
            url={seg.url}
            label={seg.label}
          />
        ) : (
          <Markdown key={idx} style={markdownStyles}>
            {seg.content}
          </Markdown>
        ),
      )}
    </>
  );
}
