import { describe, it, expect, vi } from "vitest";
import { solve, SolverSlot } from "../lib/solver";
import type { WordEntry } from "../lib/puzzle";

describe("solver logging", () => {
  it("logs slot_too_short with structured data", () => {
    const board = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];
    const slots: SolverSlot[] = [
      { row: 0, col: 0, length: 2, direction: "across", id: "across_0_0" },
    ];
    const dict: WordEntry[] = [{ answer: "HI", clue: "hi" }];
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = solve({ board, slots, dict });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("slot_too_short");
    const call = logSpy.mock.calls.find((c) =>
      c[0].includes("\"message\":\"slot_too_short\"")
    );
    expect(call).toBeTruthy();
    const parsed = JSON.parse(call![0]);
    expect(parsed).toMatchObject({
      message: "slot_too_short",
      type: "across",
      r: 0,
      c0: 0,
      c1: 1,
      len: 2,
    });
    logSpy.mockRestore();
  });

  it("logs backtrack attempts with reasons", () => {
    const board = [
      ["", ""],
      ["", ""],
    ];
    const slots: SolverSlot[] = [
      { row: 0, col: 0, length: 2, direction: "across", id: "across_0_0" },
      { row: 0, col: 0, length: 2, direction: "down", id: "down_0_0" },
    ];
    const dict: WordEntry[] = [{ answer: "AA", clue: "aa" }];
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = solve({
      board,
      slots,
      dict,
      opts: { allow2: true, maxFillAttempts: 1 },
    });
    expect(res.ok).toBe(false);
    const call = logSpy.mock.calls.find((c) =>
      c[0].includes("\"message\":\"backtrack\"") &&
      c[0].includes("\"reason\":\"max_fill_attempts\"")
    );
    expect(call).toBeTruthy();
    const parsed = JSON.parse(call![0]);
    expect(parsed).toMatchObject({ message: "backtrack", attempts: 1 });
    logSpy.mockRestore();
  });
});

