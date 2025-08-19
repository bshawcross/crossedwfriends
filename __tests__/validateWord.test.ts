import { describe, it, expect } from "vitest";
import { isValidFill } from "@/utils/validateWord";

describe("isValidFill", () => {
  it("rejects two-letter fills like ON", () => {
    expect(isValidFill("ON")).toBe(false);
  });

  it("rejects triple repeats like AAA", () => {
    expect(isValidFill("AAA")).toBe(false);
  });

  it("rejects non-alphabetic fills like A1B", () => {
    expect(isValidFill("A1B")).toBe(false);
  });

  it("accepts valid fills like APPLE", () => {
    expect(isValidFill("APPLE")).toBe(true);
  });
});

