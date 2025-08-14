import { describe, it, expect } from "vitest";
import { isValidFill } from "@/utils/validateWord";

describe("isValidFill", () => {
  it("rejects answers with non-uppercase letters", () => {
    expect(isValidFill("ok")).toBe(false);
    expect(isValidFill("A1")).toBe(false);
  });

  it("rejects single-letter answers", () => {
    expect(isValidFill("A")).toBe(false);
  });

  it("rejects two-letter answers by default", () => {
    expect(isValidFill("OK")).toBe(false);
  });

  it("allows two-letter answers when allow2 is set", () => {
    expect(isValidFill("OK", { allow2: true })).toBe(true);
    expect(isValidFill("AX", { allow2: true })).toBe(true);
    expect(isValidFill("AA", { allow2: true })).toBe(true);
  });

  it("rejects denylisted answers", () => {
    expect(isValidFill("ZZZ")).toBe(false);
  });

  it("allows other valid answers", () => {
    expect(isValidFill("GOOD")).toBe(true);
  });
});
