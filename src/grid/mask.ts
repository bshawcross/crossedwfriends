import { setBlackGuarded, symCell } from './symmetry';

export function buildMask(
  n = 15,
  targetBlocks = 36,
  maxAttempts = 5000,
  minLen = 3,
) {
  const grid: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  let placed = 0;
  if (minLen === 2) {
    try {
      setBlackGuarded(grid, 0, 2, minLen);
      placed += 2;
    } catch {
      // ignore pre-placement failure
    }
  }
  let attempts = 0;
  while (placed < targetBlocks && attempts < maxAttempts) {
    attempts++;
    const r = Math.floor(Math.random() * n);
    const c = Math.floor(Math.random() * n);
    try {
      setBlackGuarded(grid, r, c, minLen);
      const sym = symCell(r, c, n);
      if (sym.row === r && sym.col === c) {
        placed += 1;
      } else {
        placed += 2;
      }
    } catch {
      // ignore placement failures
    }
  }
  if (placed < targetBlocks) {
    throw new Error(`mask_generation_failed: placed=${placed}, target=${targetBlocks}`);
  }
  return grid;
}
