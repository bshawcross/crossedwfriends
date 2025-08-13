import { describe, it, expect } from 'vitest';
import { planHeroPlacements } from '../lib/heroPlacement';

describe('planHeroPlacements', () => {
  it('handles odd counts with central placement and paired rows', () => {
    const terms = ['odysseus', 'hercules', 'achilles', 'theseus', 'perseus'];
    const placements = planHeroPlacements(terms);
    expect(placements).toEqual([
      { term: 'ODYSSEUS', row: 7, col: 3, dir: 'across' },
      { term: 'HERCULES', row: 5, col: 3, dir: 'across' },
      { term: 'ACHILLES', row: 9, col: 3, dir: 'across' },
      { term: 'THESEUS', row: 3, col: 4, dir: 'across' },
      { term: 'PERSEUS', row: 11, col: 4, dir: 'across' },
    ]);
  });

  it('handles even counts with symmetric pairs', () => {
    const terms = ['hercules', 'achilles', 'theseus', 'perseus'];
    const placements = planHeroPlacements(terms);
    expect(placements).toEqual([
      { term: 'HERCULES', row: 6, col: 3, dir: 'across' },
      { term: 'ACHILLES', row: 8, col: 3, dir: 'across' },
      { term: 'THESEUS', row: 4, col: 4, dir: 'across' },
      { term: 'PERSEUS', row: 10, col: 4, dir: 'across' },
    ]);
  });
});
