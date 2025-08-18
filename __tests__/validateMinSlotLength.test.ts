import { describe, it, expect } from "vitest";
import { validateMinSlotLength } from "../src/validate/puzzle";

describe("validateMinSlotLength", () => {
  it("flags grids containing 2-letter slots", () => {
    const grid = [
      [false, false, false],
      [true, false, false],
      [true, true, true],
    ];
    expect(validateMinSlotLength(grid, 3)).toEqual({
      type: 'across',
      start: { row: 1, col: 1 },
      end: { row: 1, col: 2 },
      len: 2,
    });
  });

  it("detects 1-letter slots", () => {
    const grid = [
      [false, true, false],
      [true, true, true],
      [false, true, false],
    ];
    expect(validateMinSlotLength(grid, 3)).toEqual({
      type: 'across',
      start: { row: 0, col: 0 },
      end: { row: 0, col: 0 },
      len: 1,
    });
  });

  it("allows grids without short slots", () => {
    const grid = [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ];
    expect(validateMinSlotLength(grid, 3)).toBeNull();
  });
});
