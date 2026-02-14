import type { ReactNode } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface Props {
  content: string;
  isStreaming?: boolean;
}

function closePendingCodeBlocks(text: string): string {
  const count = (text.match(/```/g) || []).length;
  return count % 2 !== 0 ? text + '\n```' : text;
}

export default function AiChatMarkdown({
  content,
  isStreaming,
}: Props): ReactNode {
  const displayContent = isStreaming
    ? closePendingCodeBlocks(content)
    : content;

  return <Markdown style={markdownStyles}>{displayContent}</Markdown>;
}

const MONO_FONT = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#11181C',
  },
  heading1: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
    color: '#11181C',
  },
  heading2: {
    fontSize: 19,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
    color: '#11181C',
  },
  heading3: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    color: '#11181C',
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  strong: {
    fontWeight: '600',
  },
  em: {
    fontStyle: 'italic',
  },
  s: {
    textDecorationLine: 'line-through',
  },
  code_inline: {
    backgroundColor: '#E8E8EC',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: MONO_FONT,
    color: '#C41A4A',
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
    backgroundColor: '#F0F4F8',
    borderLeftWidth: 3,
    borderLeftColor: '#0A7EA4',
    paddingLeft: 12,
    paddingVertical: 4,
    marginVertical: 8,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  hr: {
    backgroundColor: '#E0E0E4',
    height: 1,
    marginVertical: 12,
  },
  link: {
    color: '#0A7EA4',
    textDecorationLine: 'underline',
  },
  table: {
    borderWidth: 1,
    borderColor: '#E0E0E4',
    borderRadius: 4,
    marginVertical: 8,
  },
  thead: {
    backgroundColor: '#F5F5F7',
  },
  th: {
    padding: 8,
    fontWeight: '600',
    borderWidth: 0.5,
    borderColor: '#E0E0E4',
  },
  td: {
    padding: 8,
    borderWidth: 0.5,
    borderColor: '#E0E0E4',
  },
});
