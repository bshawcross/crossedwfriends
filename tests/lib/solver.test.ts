import { describe, it, expect, vi } from 'vitest';
import { solve, SolverSlot } from '../../lib/solver';
import type { WordEntry } from '../../lib/puzzle';
import * as logger from '@/utils/logger';

describe('orderSlots', () => {
  it('prefers longer slots when candidate counts are equal', () => {
    const board = [
      ['', '', '', '', ''],
      ['', '', '', '', ''],
    ];
    const slots: SolverSlot[] = [
      { id: 'short', row: 1, col: 0, length: 3, direction: 'across' },
      { id: 'long', row: 0, col: 0, length: 5, direction: 'across' },
    ];
    const dict: WordEntry[] = [
      { answer: 'FGH', clue: '', frequency: 1 },
      { answer: 'ABCDE', clue: '', frequency: 0 },
    ];
    const infoSpy = vi.spyOn(logger, 'logInfo').mockImplementation(() => {});
    const result = solve({ board, slots, dict, rng: () => 0 });
    const placeCalls = infoSpy.mock.calls.filter(([msg]) => msg === 'place');
    infoSpy.mockRestore();
    expect(result.ok).toBe(true);
    expect(placeCalls[0][1]).toMatchObject({ slotId: 'long' });
  });
});
