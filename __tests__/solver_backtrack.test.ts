import { describe, it, expect } from 'vitest';
import seedrandom from 'seedrandom';
import { findSlots } from '../lib/slotFinder';
import { solveWithBacktracking, type SolverSlot } from '../lib/solver';
import { largeWordList } from '../tests/helpers/wordList';

describe('solveWithBacktracking', () => {
  const size = 15;
  // Build a simple 15x15 board with a single 15-letter slot
  const boardTemplate: string[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, () => (r === 7 ? '' : '#')),
  );
  const gridStr = boardTemplate.map((row) => row.map((ch) => (ch === '#' ? '#' : '.')).join(''));
  const slotData = findSlots(gridStr);
  const baseSlots: SolverSlot[] = slotData.across.map((s) => ({
    ...s,
    direction: 'across',
    id: `a_${s.row}_${s.col}`,
  }));
  const dict = largeWordList().filter((w) => w.answer.length === 15).slice(0, 1);
  const seeds = ['alpha', 'beta', 'gamma'];

  for (const seed of seeds) {
    it(`solves puzzle without fallback for seed "${seed}"`, () => {
      const board = boardTemplate.map((row) => [...row]);
      const slots = baseSlots.map((s) => ({ ...s }));
      const res = solveWithBacktracking({ board, slots, dict, seed });
      expect(res.ok).toBe(true);
    });
  }
});
