import { describe, it, expect } from "vitest";
import { repairMask } from "../lib/repairMask";
import { validateMinSlotLength } from "../src/validate/puzzle";
import { symCell } from "../grid/symmetry";

describe("repairMask", () => {
  it("fixes short slots and restores symmetry", () => {
    const grid = [
      [true, false, false],
      [false, false, false],
      [false, false, false],
    ];
    const repaired = repairMask(grid, 3);
    expect(validateMinSlotLength(repaired, 3)).toBeNull();
    const size = repaired.length;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const sym = symCell(r, c, size);
        expect(repaired[r][c]).toBe(repaired[sym.row][sym.col]);
      }
    }
  });
});
