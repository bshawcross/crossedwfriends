import { symCell } from '@/grid/symmetry';
import { validateMinSlotLength } from '../src/validate/puzzle';

export function repairMask(grid: boolean[][], minLen = 3, maxPasses = 50): boolean[][] {
  let detail = validateMinSlotLength(grid, minLen);
  let passes = 0;
  const size = grid.length;
  while (detail && passes < maxPasses) {
    passes++;
    let r: number | undefined;
    let c: number | undefined;
    if (detail.type === 'across') {
      if (detail.c0 > 0 && grid[detail.r][detail.c0 - 1]) {
        r = detail.r;
        c = detail.c0 - 1;
      } else if (detail.c1 < size - 1 && grid[detail.r][detail.c1 + 1]) {
        r = detail.r;
        c = detail.c1 + 1;
      }
    } else {
      if (detail.r > 0 && grid[detail.r - 1][detail.c0]) {
        r = detail.r - 1;
        c = detail.c0;
      } else if (detail.c1 < size - 1 && grid[detail.c1 + 1][detail.c0]) {
        r = detail.c1 + 1;
        c = detail.c0;
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
