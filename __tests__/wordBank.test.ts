import { describe, it, expect } from 'vitest';
import { buildWordBank } from '../lib/wordBank';

describe('buildWordBank', () => {
  it('normalizes, filters, dedupes and sorts words', () => {
    const words = [
      'apple',
      'Banana',
      'APPLE',
      'pear',
      'abc',
      'z',
      'AB',
      'pine-apple',
      ' kiwi ',
      'grape',
      'grape1',
      'straw berry',
    ];
    const bank = buildWordBank(words);
    expect(bank).toEqual({
      3: ['ABC'],
      4: ['KIWI', 'PEAR'],
      5: ['APPLE', 'GRAPE'],
      6: ['BANANA'],
    });
    expect(bank[2]).toBeUndefined();
  });
});
