import { describe, test, expect, vi } from 'vitest';
import { solve } from '../../lib/solver';
import seedrandom from 'seedrandom';
import { board5x5, slots5x5, dict5x5 } from '../helpers/puzzle5x5';

describe('fill integration 2025-08-21', () => {
  test('fills grid and logs no missing_length', () => {
    const board = board5x5.map((row) => [...row]);
    const slots = slots5x5.map((s) => ({ ...s }));
    const dict = dict5x5.map((w) => ({ ...w }));

    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((m: string) => logs.push(m));
    vi.spyOn(console, 'error').mockImplementation((m: string) => logs.push(m));

    const res = solve({
      board,
      slots,
      dict,
      heroes: [],
      rng: seedrandom('2025-08-21'),
      opts: { maxBranchAttempts: 50, maxTotalAttempts: 20, maxTimeBudgetMs: 1000 },
    });

    expect(res.ok).toBe(true);
    expect(board.flat().every((c) => c === '#' || c)).toBe(true);

    const messages = logs
      .filter((l) => l.startsWith('{'))
      .map((l) => JSON.parse(l).message);
    expect(messages).not.toContain('missing_length');
  });
});
