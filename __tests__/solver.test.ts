import { describe, it, expect, vi } from "vitest";
import { solve, SolverSlot } from "../lib/solver";
import type { WordEntry } from "../lib/puzzle";
import { board5x5, slots5x5, dict5x5 } from "../tests/helpers/puzzle5x5";

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
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];
    const slots: SolverSlot[] = [
      { row: 0, col: 0, length: 3, direction: "across", id: "across_0_0" },
      { row: 0, col: 0, length: 3, direction: "down", id: "down_0_0" },
    ];
    const dict: WordEntry[] = [{ answer: "AAA", clue: "aaa" }];
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = solve({
      board,
      slots,
      dict,
      opts: { maxFillAttempts: 1, maxFallbackRate: 1 },
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

  it("aborts when fallback rate exceeds threshold", () => {
    const board = [["", "", ""]];
    const slots: SolverSlot[] = [
      { row: 0, col: 0, length: 3, direction: "across", id: "across_0_0" },
    ];
    const dict: WordEntry[] = [];
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = solve({ board, slots, dict });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("fallback_rate_exceeded");
    const call = warnSpy.mock.calls.find((c) =>
      c[0].includes("\"message\":\"fallback_rate_exceeded\"")
    );
    expect(call).toBeTruthy();
    const parsed = JSON.parse(call![0]);
    expect(parsed).toMatchObject({ message: "fallback_rate_exceeded" });
    warnSpy.mockRestore();
  });
});

describe("solver puzzle", () => {
  it("fills 5x5 puzzle without heroes", () => {
    const board = board5x5.map((row) => [...row]);
    const slots = slots5x5.map((s) => ({ ...s }));
    const dict = dict5x5.map((w) => ({ ...w }));
    const res = solve({ board, slots, dict });
    expect(res.ok).toBe(true);
  });

    it("demotes impossible hero and still solves", () => {
      const board = [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ];
      const slots: SolverSlot[] = [
        { row: 0, col: 0, length: 3, direction: "across", id: "across" },
        { row: 0, col: 0, length: 3, direction: "down", id: "down" },
      ];
      const dict: WordEntry[] = [
        { answer: "CAR", clue: "car" },
        { answer: "CAT", clue: "cat" },
      ];
      const logSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const res = solve({
        board,
        slots,
        heroes: [{ answer: "ABZ", clue: "abz" }],
        dict,
        opts: { heroThreshold: 0 },
      });
      expect(res.ok).toBe(true);
      const call = logSpy.mock.calls.find((c) =>
        c[0].includes("\"message\":\"hero_demoted\"")
      );
      expect(call).toBeTruthy();
      const parsed = JSON.parse(call![0]);
      expect(parsed).toMatchObject({
        message: "hero_demoted",
        word: "ABZ",
        reason: "no_fit_after_threshold",
      });
      logSpy.mockRestore();
    });
  });

