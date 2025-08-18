export function symCell(row: number, col: number, size = 15) {
  return { row: size - 1 - row, col: size - 1 - col };
}

function checkRuns(grid: boolean[][], row: number, col: number, minLen: number) {
  const size = grid.length;
  let len = 0;
  for (let c = col - 1; c >= 0 && !grid[row][c]; c--) len++;
  if (len > 0 && len < minLen) return true;
  len = 0;
  for (let c = col + 1; c < size && !grid[row][c]; c++) len++;
  if (len > 0 && len < minLen) return true;
  len = 0;
  for (let r = row - 1; r >= 0 && !grid[r][col]; r--) len++;
  if (len > 0 && len < minLen) return true;
  len = 0;
  for (let r = row + 1; r < size && !grid[r][col]; r++) len++;
  if (len > 0 && len < minLen) return true;
  return false;
}

export function wouldCreateShortSlot(
  grid: boolean[][],
  row: number,
  col: number,
  minLen: number,
) {
  const size = grid.length;
  const cells = [{ row, col }];
  const sym = symCell(row, col, size);
  if (sym.row !== row || sym.col !== col) cells.push(sym);

  const prev: boolean[] = [];
  cells.forEach(({ row, col }, idx) => {
    prev[idx] = grid[row][col];
    grid[row][col] = true;
  });

  const result = cells.some(({ row, col }) => checkRuns(grid, row, col, minLen));

  cells.forEach(({ row, col }, idx) => {
    grid[row][col] = prev[idx];
  });

  return result;
}

export function setBlackGuarded(
  grid: boolean[][],
  row: number,
  col: number,
  minLen: number,
) {
  if (grid[row][col]) return;
  if (wouldCreateShortSlot(grid, row, col, minLen)) {
    throw new Error(`guard_rejected_black_at_${row}_${col}`);
  }
  const sym = symCell(row, col, grid.length);
  grid[row][col] = true;
  grid[sym.row][sym.col] = true;
}
