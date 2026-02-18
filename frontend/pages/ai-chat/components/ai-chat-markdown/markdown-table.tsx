import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { ScrollView, Text as RNText, View as RNView } from 'react-native';
import { useTheme } from 'tamagui';

import { TABLE_FONT_SIZE, CELL_PAD_H } from '../../consts';
import type { MergeCell } from '../../utils';
import {
  calcColumnWidths,
  computeMergeMap,
  renderInlineMarkdown,
} from '../../utils';

interface Props {
  headers: string[];
  rows: string[][];
}

export default function MarkdownTable({ headers, rows }: Props): ReactNode {
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
