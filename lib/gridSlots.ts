import type { Cell } from './puzzle';

export function getSlotLengths(grid: Cell[][]) {
  const size = grid.length;
  const horiz: number[] = [];
  const vert: number[] = [];

  for (let r = 0; r < size; r++) {
    let len = 0;
    for (let c = 0; c < size; c++) {
      if (!grid[r][c].isBlack) {
        len++;
      }
      if (grid[r][c].isBlack || c === size - 1) {
        if (len > 1) horiz.push(len);
        len = 0;
      }
    }
  }

  for (let c = 0; c < size; c++) {
    let len = 0;
    for (let r = 0; r < size; r++) {
      if (!grid[r][c].isBlack) {
        len++;
      }
      if (grid[r][c].isBlack || r === size - 1) {
        if (len > 1) vert.push(len);
        len = 0;
      }
    }
  }

  const all = [...horiz, ...vert].sort((a, b) => a - b);
  return { horiz: horiz.sort((a, b) => a - b), vert: vert.sort((a, b) => a - b), all };
}
