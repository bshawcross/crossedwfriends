import { describe, it, expect } from 'vitest';
import { buildWordBank } from '../lib/wordBank';

describe('buildWordBank', () => {
  it('normalizes, filters, dedupes and sorts words', () => {
    const words = ['apple', 'Banana', 'APPLE', 'pear', 'abc', 'z', 'AB', 'pine-apple'];
    const bank = buildWordBank(words);
    expect(bank).toEqual({
      3: ['ABC'],
      4: ['PEAR'],
      5: ['APPLE'],
      6: ['BANANA'],
    });
  });
});
