import { describe, it, expect } from "vitest";
import { symCell, setBlackGuarded } from "../grid/symmetry";

describe("symCell", () => {
  it("returns rotational counterpart", () => {
    expect(symCell(0, 0, 5)).toEqual({ row: 4, col: 4 });
    expect(symCell(1, 3, 5)).toEqual({ row: 3, col: 1 });
  });
});

describe("setBlackGuarded", () => {
  const makeGrid = () => Array.from({ length: 5 }, () => Array(5).fill(false));

  it("adds both cell and its symmetric counterpart", () => {
    const grid = makeGrid();
    setBlackGuarded(grid, 0, 0, 2);
    expect(grid[0][0]).toBe(true);
    expect(grid[4][4]).toBe(true);
  });

  it("handles center cell without duplication", () => {
    const grid = makeGrid();
    setBlackGuarded(grid, 2, 2, 2);
    const count = grid.flat().filter(Boolean).length;
    expect(count).toBe(1);
    expect(grid[2][2]).toBe(true);
  });

  it("throws when a short slot would be created", () => {
    const grid = makeGrid();
    expect(() => setBlackGuarded(grid, 0, 1, 3)).toThrow(
      "guard_rejected_black_at_0_1",
    );
  });
});
