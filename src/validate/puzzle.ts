export function validateSymmetry(grid: boolean[][]): boolean {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== grid[size - 1 - r][size - 1 - c]) {
        return false;
      }
    }
  }
  return true;
}

export function getSlotLengths(grid: boolean[][], orientation: 'across' | 'down'): number[] {
  const size = grid.length;
  const lengths: number[] = [];
  if (orientation === 'across') {
    for (let r = 0; r < size; r++) {
      let len = 0;
      for (let c = 0; c < size; c++) {
        if (!grid[r][c]) {
          len++;
        }
        if (grid[r][c]) {
          if (len > 0) lengths.push(len);
          len = 0;
        } else if (c === size - 1) {
          if (len > 0) lengths.push(len);
          len = 0;
        }
      }
    }
  } else {
    for (let c = 0; c < size; c++) {
      let len = 0;
      for (let r = 0; r < size; r++) {
        if (!grid[r][c]) {
          len++;
        }
        if (grid[r][c]) {
          if (len > 0) lengths.push(len);
          len = 0;
        } else if (r === size - 1) {
          if (len > 0) lengths.push(len);
          len = 0;
        }
      }
    }
  }
  return lengths;
}

export type ShortSlotDetail = {
  type: 'across' | 'down';
  r: number;
  c0: number;
  c1: number;
  len: number;
};

function findFirstShortSlot(grid: boolean[][], min: number): ShortSlotDetail | null {
  const size = grid.length;
  // Scan across
  for (let r = 0; r < size; r++) {
    let len = 0;
    let start = -1;
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) {
        if (len === 0) start = c;
        len++;
      }
      if (grid[r][c] || c === size - 1) {
        const end = grid[r][c] ? c - 1 : c;
        if (len > 0) {
          if (len < min) return { type: 'across', r, c0: start, c1: end, len };
        }
        len = 0;
        start = -1;
      }
    }
  }

  // Scan down
  for (let c = 0; c < size; c++) {
    let len = 0;
    let start = -1;
    for (let r = 0; r < size; r++) {
      if (!grid[r][c]) {
        if (len === 0) start = r;
        len++;
      }
      if (grid[r][c] || r === size - 1) {
        const end = grid[r][c] ? r - 1 : r;
        if (len > 0) {
          if (len < min) return { type: 'down', r: start, c0: c, c1: end, len };
        }
        len = 0;
        start = -1;
      }
    }
  }

  return null;
}

export function validateMinSlotLength(
  grid: boolean[][],
  min: number,
): ShortSlotDetail | null {
  return findFirstShortSlot(grid, min);
}

