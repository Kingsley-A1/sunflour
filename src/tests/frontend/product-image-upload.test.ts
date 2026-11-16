import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildProductImageAltText,
  ImageUploadError,
  MAX_UPLOAD_BYTES,
  uploadProductImage,
} from "@/lib/api/product-image-upload";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function imageFile(bytes = 1024, type = "image/webp", name = "cake.webp"): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("product image upload helpers", () => {
  it("generates alt text from the product name, not the file name", () => {
    expect(buildProductImageAltText("Vanilla Cake", 0, 1)).toBe("Vanilla Cake");
    expect(buildProductImageAltText("Vanilla Cake", 1, 3)).toBe("Vanilla Cake — view 2");
  });

  it("returns the stored media asset on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(201, {
          ok: true,
          data: { mediaAsset: { id: "media_1", publicUrl: "https://cdn/x.webp" } },
        }),
      ),
    );

    await expect(uploadProductImage(imageFile())).resolves.toEqual({
      mediaAssetId: "media_1",
      url: "https://cdn/x.webp",
    });
  });

  it("surfaces storage misconfiguration as a storage error without retrying", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(502, {
        ok: false,
        error: {
          code: "STORAGE_MISCONFIGURED",
          message: "Image storage rejected the upload (access denied).",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const error = await uploadProductImage(imageFile()).catch((caught) => caught);

    expect(error).toBeInstanceOf(ImageUploadError);
    expect(error.kind).toBe("storage-config");
    expect(error.message).toMatch(/storage/i);
    expect(error.message).not.toMatch(/network|connection/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("names a platform 413 as a size problem, not the network", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Request Entity Too Large", { status: 413 })),
    );

    const error = await uploadProductImage(imageFile()).catch((caught) => caught);

    expect(error.kind).toBe("too-large");
  });

  it("refuses files that would exceed the platform body limit before sending", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const error = await uploadProductImage(imageFile(MAX_UPLOAD_BYTES + 1)).catch(
      (caught) => caught,
    );

    expect(error.kind).toBe("too-large");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("explains HEIC photos instead of failing vaguely", async () => {
    const error = await uploadProductImage(
      imageFile(1024, "image/heic", "IMG_0001.HEIC"),
    ).catch((caught) => caught);

    expect(error.kind).toBe("unsupported");
    expect(error.message).toMatch(/HEIC/);
  });

  it("retries transient storage outages and succeeds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(503, {
          ok: false,
          error: { code: "STORAGE_UNAVAILABLE", message: "Image storage did not respond in time." },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(201, {
          ok: true,
          data: { mediaAsset: { id: "media_2", publicUrl: null } },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const pending = uploadProductImage(imageFile());
    await vi.runAllTimersAsync();

    await expect(pending).resolves.toEqual({ mediaAssetId: "media_2", url: null });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("only calls it a connection problem when the request itself dropped", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const pending = uploadProductImage(imageFile()).catch((caught) => caught);
    await vi.runAllTimersAsync();
    const error = await pending;

    expect(error.kind).toBe("connection");
  });
});
