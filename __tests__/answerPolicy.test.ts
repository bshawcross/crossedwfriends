import { describe, it, expect } from "vitest";
import { isAnswerAllowed } from "../lib/answerPolicy";

describe("isAnswerAllowed", () => {
  it("rejects answers with non-uppercase letters", () => {
    expect(isAnswerAllowed("ok")).toBe(false);
    expect(isAnswerAllowed("A1")).toBe(false);
  });

  it("rejects single-letter answers", () => {
    expect(isAnswerAllowed("A")).toBe(false);
  });

  it("allows whitelisted two-letter answers", () => {
    expect(isAnswerAllowed("OK")).toBe(true);
    expect(isAnswerAllowed("AX")).toBe(true);
  });

  it("rejects non-whitelisted two-letter answers", () => {
    expect(isAnswerAllowed("AA")).toBe(false);
  });

  it("rejects denylisted answers", () => {
    expect(isAnswerAllowed("ZZZ")).toBe(false);
  });

  it("allows other valid answers", () => {
    expect(isAnswerAllowed("GOOD")).toBe(true);
  });
});
