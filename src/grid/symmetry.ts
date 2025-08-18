export function symCell(row: number, col: number, size = 15) {
  return { row: size - 1 - row, col: size - 1 - col };
}

export function setBlack(blocks: Set<string>, row: number, col: number, size = 15) {
  blocks.add(`${row}_${col}`);
  const sym = symCell(row, col, size);
  blocks.add(`${sym.row}_${sym.col}`);
}
