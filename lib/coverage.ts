import type { WordBank } from './wordBank';

export function validateCoverage(slotLengths: number[], bank: WordBank) {
  const need: Record<number, number> = {};
  for (const len of slotLengths) {
    if (len === 2) continue;
    need[len] = (need[len] || 0) + 1;
  }

  const missing: number[] = [];
  for (const [lenStr, count] of Object.entries(need)) {
    const len = Number(lenStr);
    const available = bank[len]?.length ?? 0;
    if (available < count) missing.push(len);
  }
  return { need, missing };
}
