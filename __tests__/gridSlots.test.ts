import { describe, it, expect } from 'vitest';
import { getSlotLengths } from '../lib/gridSlots';
import type { Cell } from '../lib/puzzle';

describe('getSlotLengths', () => {
  const cell = (row: number, col: number, isBlack: boolean): Cell => ({
    row,
    col,
    isBlack,
    answer: '',
    clueNumber: null,
    userInput: '',
    isSelected: false,
  });

  it('computes horizontal and vertical slot lengths', () => {
    const grid: Cell[][] = [
      [cell(0, 0, true), cell(0, 1, false), cell(0, 2, false)],
      [cell(1, 0, false), cell(1, 1, true), cell(1, 2, false)],
      [cell(2, 0, false), cell(2, 1, false), cell(2, 2, true)],
    ];
    expect(getSlotLengths(grid)).toEqual({
      horiz: [2, 2],
      vert: [2, 2],
      all: [2, 2, 2, 2],
    });
  });

  it('handles grids with no slots', () => {
    const grid: Cell[][] = [
      [cell(0, 0, true), cell(0, 1, true)],
      [cell(1, 0, true), cell(1, 1, true)],
    ];
    expect(getSlotLengths(grid)).toEqual({ horiz: [], vert: [], all: [] });
  });
});
