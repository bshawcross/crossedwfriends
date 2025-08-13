import { describe, it, expect } from 'vitest';
import { planHeroPlacements } from '../../lib/heroPlacement';

describe('planHeroPlacements', () => {
  it('places a central hero and symmetric pairs', () => {
    const heroes = ['CAPTAINMARVEL', 'BLACKWIDOW', 'SPIDERMAN', 'IRONMAN', 'THOR'];
    const placements = planHeroPlacements(heroes);
    expect(placements).toEqual([
      { term: 'CAPTAINMARVEL', row: 7, col: 1, dir: 'across' },
      { term: 'BLACKWIDOW', row: 5, col: 2, dir: 'across' },
      { term: 'SPIDERMAN', row: 9, col: 3, dir: 'across' },
      { term: 'IRONMAN', row: 3, col: 4, dir: 'across' },
      { term: 'THOR', row: 11, col: 5, dir: 'across' },
    ]);
  });
});

