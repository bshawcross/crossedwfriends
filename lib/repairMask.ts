import { symCell } from '@/grid/symmetry';
import { validateMinSlotLength } from '../src/validate/puzzle';

export function repairMask(
  grid: boolean[][],
  minLen = 3,
  maxPasses = 50,
  allow2 = false,
): boolean[][] {
  if (allow2) return grid;
  let detail = validateMinSlotLength(grid, minLen);
  let passes = 0;
  const size = grid.length;
  while (detail && passes < maxPasses) {
    passes++;
    let r: number | undefined;
    let c: number | undefined;
    if (detail.type === 'across') {
      const { row } = detail.start;
      if (detail.start.col > 0 && grid[row][detail.start.col - 1]) {
        r = row;
        c = detail.start.col - 1;
      } else if (detail.end.col < size - 1 && grid[row][detail.end.col + 1]) {
        r = row;
        c = detail.end.col + 1;
      }
    } else {
      const { col } = detail.start;
      if (detail.start.row > 0 && grid[detail.start.row - 1][col]) {
        r = detail.start.row - 1;
        c = col;
      } else if (detail.end.row < size - 1 && grid[detail.end.row + 1][col]) {
        r = detail.end.row + 1;
        c = col;
      }
    }
    if (r === undefined || c === undefined) break;
    const sym = symCell(r, c, size);
    grid[r][c] = false;
    grid[sym.row][sym.col] = false;
    detail = validateMinSlotLength(grid, minLen);
  }
  if (detail) {
    throw new Error('mask_repair_failed');
  }
  return grid;
}

export default repairMask;
