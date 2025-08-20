import { describe, it, expect } from "vitest";
import { solve } from "../lib/solver";
import { board5x5, slots5x5, dict5x5 } from "../tests/helpers/puzzle5x5";

describe("solver", () => {
  it("fills 5x5 puzzle without heroes", () => {
    const board = board5x5.map((row) => [...row]);
    const slots = slots5x5.map((s) => ({ ...s }));
    const dict = dict5x5.map((w) => ({ ...w }));
    const res = solve({ board, slots, dict });
    expect(res.ok).toBe(true);
  });
});
