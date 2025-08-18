import { describe, it, expect } from "vitest";
import { isValidFill } from "@/utils/validateWord";

describe("isValidFill", () => {
  it("rejects short words", () => {
    expect(isValidFill("ON")).toBe(false);
  });

  it("rejects triple repeated letters", () => {
    expect(isValidFill("AAA")).toBe(false);
  });

  it("rejects answers with non-A–Z characters", () => {
    expect(isValidFill("A1B")).toBe(false);
  });

  it("accepts valid fills", () => {
    expect(isValidFill("APPLE")).toBe(true);
  });
});

