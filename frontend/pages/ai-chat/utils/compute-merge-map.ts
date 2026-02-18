export interface MergeCell {
  rowspan: number;
  hidden: boolean;
}

export function computeMergeMap(rows: string[][]): MergeCell[][] {
  if (rows.length === 0) return [];

  const colCount = rows[0].length;
  const map: MergeCell[][] = rows.map(() =>
    Array.from({ length: colCount }, () => ({ rowspan: 1, hidden: false })),
  );

  for (let ci = 0; ci < colCount; ci++) {
    let anchorRi = -1;

    for (let ri = 0; ri < rows.length; ri++) {
      const isEmpty = (rows[ri][ci] ?? '').trim() === '';

      if (!isEmpty) {
        anchorRi = ri;
      } else if (anchorRi >= 0) {
        map[anchorRi][ci].rowspan++;
        map[ri][ci].hidden = true;
      }
    }
  }

  return map;
}
