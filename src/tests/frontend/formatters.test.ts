import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  formatNairaFromKobo,
  koboToNairaInput,
  nairaInputToKobo,
} from "@/lib/formatters";

describe("frontend formatters", () => {
  it("formats kobo as NGN display text", () => {
    expect(formatNairaFromKobo(250000)).toContain("2,500");
  });

  it("converts naira input to kobo", () => {
    expect(nairaInputToKobo("1,250.50")).toBe(125050);
  });

  it("converts kobo to naira input", () => {
    expect(koboToNairaInput(990000)).toBe("9900");
  });

  it("handles invalid dates without throwing", () => {
    expect(formatDateTime("not-a-date")).toBe("Not available");
  });
});
