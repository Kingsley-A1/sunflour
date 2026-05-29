import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiRequest,
  getApiErrorMessage,
  getApiFieldError,
} from "@/lib/api/client";
import { ApiClientError } from "@/types/api";

describe("frontend API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws a normalized error for invalid JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not-json", {
          status: 502,
        }),
      ),
    );

    await expect(apiRequest("/api/test")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 502,
    });
  });

  it("preserves API error code and field errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            ok: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Validation failed.",
              fieldErrors: {
                phone: ["Enter your phone number."],
              },
            },
          },
          {
            status: 400,
          },
        ),
      ),
    );

    await expect(apiRequest("/api/test")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      fieldErrors: {
        phone: ["Enter your phone number."],
      },
      status: 400,
    });
  });

  it("maps common error codes to user-facing copy", () => {
    const error = new ApiClientError({
      code: "PAYMENT_SETTINGS_UNAVAILABLE",
      message: "Payment settings missing.",
      status: 400,
    });

    expect(getApiErrorMessage(error)).toContain("Payment setup");
  });

  it("returns the first matching field error", () => {
    expect(
      getApiFieldError(
        {
          "customer.phone": ["Enter your phone number."],
        },
        "phone",
        "customer.phone",
      ),
    ).toBe("Enter your phone number.");
  });

  it("throws a network error when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(apiRequest("/api/test")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      status: 0,
    });
  });
});
