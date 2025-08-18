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
      r: 1,
      c0: 1,
      c1: 2,
      len: 2,
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
