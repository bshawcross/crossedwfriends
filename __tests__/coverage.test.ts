import { describe, it, expect } from 'vitest';
import { validateCoverage } from '../lib/coverage';
import type { WordBank } from '../lib/wordBank';

describe('validateCoverage', () => {
  it('reports missing lengths and counts', () => {
    const bank: WordBank = { 3: ['CAT'], 4: ['LION'] };
    const slots = [3, 3, 4, 5];
    expect(validateCoverage(slots, bank)).toEqual({
      need: { 3: 2, 4: 1, 5: 1 },
      missing: [3, 5],
    });
  });

  it('passes when bank covers all slot lengths', () => {
    const bank: WordBank = {
      3: ['CAT', 'DOG'],
      4: ['LION', 'BEAR'],
      5: ['TIGER'],
    };
    const slots = [3, 4, 5];
    expect(validateCoverage(slots, bank)).toEqual({
      need: { 3: 1, 4: 1, 5: 1 },
      missing: [],
    });
  });
});
