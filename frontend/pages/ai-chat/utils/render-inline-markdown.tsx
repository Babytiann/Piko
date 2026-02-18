import type { ReactNode } from 'react';
import { Text as RNText } from 'react-native';

import { MONO_FONT, TABLE_FONT_SIZE } from '../consts';

const INLINE_MD_RE = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~)/g;

export function renderInlineMarkdown(text: string, codeBg: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  INLINE_MD_RE.lastIndex = 0;
  while ((match = INLINE_MD_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2] != null) {
      parts.push(
        <RNText key={key++} style={{ fontWeight: '700' }}>
          {match[2]}
        </RNText>,
      );
    } else if (match[3] != null) {
      parts.push(
        <RNText key={key++} style={{ fontStyle: 'italic' }}>
          {match[3]}
        </RNText>,
      );
    } else if (match[4] != null) {
      parts.push(
        <RNText
          key={key++}
          style={{
            backgroundColor: codeBg,
            fontFamily: MONO_FONT,
            fontSize: TABLE_FONT_SIZE - 1,
            borderRadius: 3,
          }}
        >
          {match[4]}
        </RNText>,
      );
    } else if (match[5] != null) {
      parts.push(
        <RNText key={key++} style={{ textDecorationLine: 'line-through' }}>
          {match[5]}
        </RNText>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}
