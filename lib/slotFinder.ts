export type Slot = {
  row: number;
  col: number;
  length: number;
};

export function findSlots(grid: string[]): { across: Slot[]; down: Slot[] } {
  const size = grid.length;
  const across: Slot[] = [];
  const down: Slot[] = [];

  const isBlack = (r: number, c: number) => grid[r][c] === '#';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isBlack(r, c)) continue;
      // across start
      if ((c === 0 || isBlack(r, c - 1)) && c + 1 < size && !isBlack(r, c + 1)) {
        let len = 1;
        while (c + len < size && !isBlack(r, c + len)) len++;
        if (len > 1) across.push({ row: r, col: c, length: len });
      }
      // down start
      if ((r === 0 || isBlack(r - 1, c)) && r + 1 < size && !isBlack(r + 1, c)) {
        let len = 1;
        while (r + len < size && !isBlack(r + len, c)) len++;
        if (len > 1) down.push({ row: r, col: c, length: len });
      }
    }
  }

  return { across, down };
}
