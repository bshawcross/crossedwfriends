import { describe, it, expect } from "vitest";
import { buildMask } from "../grid/mask";
import { validateMinSlotLength } from "../src/validate/puzzle";
import { symCell } from "../grid/symmetry";

describe("buildMask", () => {
  it("produces symmetric masks without short slots", () => {
    const size = 5;
    const mask = buildMask(size, 4, 1000, 3);
    expect(validateMinSlotLength(mask, 3)).toBeNull();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const sym = symCell(r, c, size);
        expect(mask[r][c]).toBe(mask[sym.row][sym.col]);
      }
    }
  });
});
