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
          if (len > 1) lengths.push(len);
          len = 0;
        } else if (c === size - 1) {
          if (len > 1) lengths.push(len);
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
          if (len > 1) lengths.push(len);
          len = 0;
        } else if (r === size - 1) {
          if (len > 1) lengths.push(len);
          len = 0;
        }
      }
    }
  }
  return lengths;
}

export function validateMinSlotLength(grid: boolean[][], min: number): number[] {
  const lengths = [
    ...getSlotLengths(grid, 'across'),
    ...getSlotLengths(grid, 'down'),
  ];
  return lengths.filter((len) => len < min);
}

