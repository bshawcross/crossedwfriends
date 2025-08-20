import { describe, it, expect } from 'vitest';
import { getSlotLengths } from '../lib/gridSlots';
import type { Cell } from '../lib/puzzle';

describe('getSlotLengths', () => {
  const makeGrid = (rows: string[]): Cell[][] =>
    rows.map((row, r) =>
      row.split('').map((ch, c) => ({
        row: r,
        col: c,
        isBlack: ch === '#',
        answer: '',
        clueNumber: null,
        userInput: '',
        isSelected: false,
      })),
    );

  it('computes horizontal and vertical slot lengths', () => {
    const grid = makeGrid([
      '##..#',
      '...##',
      '#....',
      '##..#',
      '..###',
    ]);
    const res = getSlotLengths(grid);
    expect(res).toEqual({
      horiz: [2, 2, 2, 3, 4],
      vert: [2, 2, 4],
      all: [2, 2, 2, 2, 2, 3, 4, 4],
    });
  });

  it('handles grids with no slots', () => {
    const grid = makeGrid([
      '##',
      '##',
    ]);
    expect(getSlotLengths(grid)).toEqual({ horiz: [], vert: [], all: [] });
  });
});
