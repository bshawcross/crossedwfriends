import { describe, it, expect } from 'vitest';
import { findSlots } from '../lib/slotFinder';

describe('findSlots', () => {
  it('identifies across and down slots with correct positions and lengths', () => {
    const grid = [
      '##..#',
      '...##',
      '#....',
      '##..#',
      '..###',
    ];
    const { across, down } = findSlots(grid);
    expect(across).toEqual([
      { row: 0, col: 2, length: 2 },
      { row: 1, col: 0, length: 3 },
      { row: 2, col: 1, length: 4 },
      { row: 3, col: 2, length: 2 },
      { row: 4, col: 0, length: 2 },
    ]);
    expect(down).toEqual([
      { row: 0, col: 2, length: 4 },
      { row: 1, col: 1, length: 2 },
      { row: 2, col: 3, length: 2 },
    ]);
  });
});
