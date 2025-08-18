import { describe, it, expect } from "vitest";
import { setBlackGuarded, symCell } from "../grid/symmetry";

describe("setBlackGuarded", () => {
  const makeGrid = () => Array.from({ length: 5 }, () => Array(5).fill(false));

  it("throws when placement creates a 2-cell run", () => {
    const grid = makeGrid();
    expect(() => setBlackGuarded(grid, 0, 2, 3)).toThrow(
      "guard_rejected_black_at_0_2",
    );
  });

  it("places symmetric blacks for legal moves", () => {
    const grid = makeGrid();
    setBlackGuarded(grid, 0, 0, 3);
    const sym = symCell(0, 0, 5);
    expect(grid[0][0]).toBe(true);
    expect(grid[sym.row][sym.col]).toBe(true);
  });
});
