import { describe, it, expect } from 'vitest';
import { validateCoverage } from '../lib/coverage';
import type { WordBank } from '../lib/wordBank';

describe('validateCoverage', () => {
  it('reports missing lengths when bank is insufficient', () => {
    const bank: WordBank = { 3: ['CAT', 'DOG'], 4: ['LION'] };
    const slots = [3, 3, 4, 4];
    expect(validateCoverage(slots, bank)).toEqual({
      need: { 3: 2, 4: 2 },
      missing: [4],
    });
  });

  it('returns empty missing when bank covers slots and skips length 2', () => {
    const bank: WordBank = { 3: ['CAT'] };
    const slots = [2, 2, 3];
    expect(validateCoverage(slots, bank)).toEqual({
      need: { 3: 1 },
      missing: [],
    });
  });
});
