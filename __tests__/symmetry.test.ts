import { describe, it, expect } from "vitest";
import { symCell, setBlack } from "../grid/symmetry";

describe("symCell", () => {
  it("returns rotational counterpart", () => {
    expect(symCell(0, 0, 5)).toEqual({ row: 4, col: 4 });
    expect(symCell(1, 3, 5)).toEqual({ row: 3, col: 1 });
  });
});

describe("setBlack", () => {
  it("adds both cell and its symmetric counterpart", () => {
    const blocks = new Set<string>();
    setBlack(blocks, 1, 2, 5);
    expect(blocks.has("1_2")).toBe(true);
    expect(blocks.has("3_2")).toBe(true);
  });

  it("handles center cell without duplication", () => {
    const blocks = new Set<string>();
    setBlack(blocks, 2, 2, 5);
    expect(blocks.size).toBe(1);
    expect(blocks.has("2_2")).toBe(true);
  });
});
