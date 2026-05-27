import { describe, expect, it } from "vitest";
import {
  addKobo,
  formatNairaFromKobo,
  makeMoney,
  multiplyKobo,
  nairaToKobo,
} from "@/server/lib/money/money";

describe("money utilities", () => {
  it("converts naira values to kobo safely", () => {
    expect(nairaToKobo(500)).toBe(50000);
    expect(nairaToKobo(12.5)).toBe(1250);
  });

  it("adds and multiplies integer money amounts", () => {
    expect(addKobo(50000, 1250)).toBe(51250);
    expect(multiplyKobo(25000, 3)).toBe(75000);
  });

  it("formats NGN values for display", () => {
    expect(formatNairaFromKobo(150000)).toContain("1,500");
  });

  it("rejects negative amounts and invalid quantities", () => {
    expect(() => makeMoney(-1)).toThrow(RangeError);
    expect(() => multiplyKobo(1000, 0)).toThrow(RangeError);
  });
});
