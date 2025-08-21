export const missingLengthMask: boolean[][] = (() => {
  const size = 15;
  const grid = Array.from({ length: size }, () => Array(size).fill(true)); // start all black
  // top row: one leading block, rest open (14-slot)
  grid[0][0] = true;
  for (let c = 1; c < size; c++) grid[0][c] = false;
  // bottom row: trailing block
  grid[size - 1][size - 1] = true;
  for (let c = 0; c < size - 1; c++) grid[size - 1][c] = false;
  // columns 0-2 and 12-14 open in middle rows to keep min slot length >=3
  for (let r = 1; r < size - 1; r++) {
    for (let c = 0; c < 3; c++) grid[r][c] = false;
    for (let c = size - 3; c < size; c++) grid[size - 1 - r][c] = false;
  }
  // open a 5x5 central block
  for (let r = 5; r <= 9; r++) {
    for (let c = 5; c <= 9; c++) {
      grid[r][c] = false;
    }
  }
  return grid;
})();
