import { describe, it, expect } from "vitest";
import { validateMinSlotLength } from "../src/validate/puzzle";

describe("validateMinSlotLength", () => {
  it("flags grids containing 2-letter slots", () => {
    const grid = [
      [false, false, false],
      [true, false, false],
      [true, true, true],
    ];
    expect(validateMinSlotLength(grid, 3)).toEqual([2, 2, 2]);
  });

  it("allows grids without short slots", () => {
    const grid = [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ];
    expect(validateMinSlotLength(grid, 3)).toEqual([]);
  });
});
