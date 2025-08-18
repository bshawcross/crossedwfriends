import { describe, it, expect } from 'vitest';
import { repairMask } from '../lib/repairMask';
import { validateMinSlotLength } from '../src/validate/puzzle';
import { symCell } from '../grid/symmetry';

describe('repairMask', () => {
  it('repairs asymmetric grids with short slots', () => {
    const grid = [
      [true, false, false],
      [false, false, false],
      [false, false, false],
    ];
    const repaired = repairMask(grid, 3);
    expect(validateMinSlotLength(repaired, 3)).toBeNull();
    const s = symCell(0, 0, repaired.length);
    expect(repaired[0][0]).toBe(false);
    expect(repaired[s.row][s.col]).toBe(false);
  });

  it('repairs short slots in symmetric grids', () => {
    const grid = [
      [false, false, false],
      [true, false, true],
      [false, false, false],
    ];
    const repaired = repairMask(grid, 3);
    expect(validateMinSlotLength(repaired, 3)).toBeNull();
    expect(repaired[1][0]).toBe(false);
    expect(repaired[1][2]).toBe(false);
  });

  it('throws when repair fails', () => {
    const grid = [
      [false, false],
      [false, false],
    ];
    expect(() => repairMask(grid, 3)).toThrow();
  });
});
