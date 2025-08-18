import { describe, it, expect } from "vitest";
import { isValidFill } from "@/utils/validateWord";

describe("isValidFill", () => {
  it("rejects answers with non-A–Z characters", () => {
    expect(isValidFill("ok")).toBe(false);
    expect(isValidFill("A1")).toBe(false);
  });

  it("rejects short words", () => {
    expect(isValidFill("A")).toBe(false);
    expect(isValidFill("OK")).toBe(false);
  });

  it("allows two-letter answers when allow2 is set", () => {
    expect(isValidFill("OK", { allow2: true })).toBe(true);
    expect(isValidFill("AX", { allow2: true })).toBe(true);
    expect(isValidFill("AA", { allow2: true })).toBe(true);
  });

  it("rejects triple repeated letters", () => {
    expect(isValidFill("ZZZ")).toBe(false);
  });

  it("accepts valid fills", () => {
    expect(isValidFill("GOOD")).toBe(true);
  });
});
