"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminUploadFieldProps {
  productId: string;
}

interface PresignResponse {
  mediaAsset: {
    id: string;
    publicUrl: string | null;
  };
  upload: {
    method: "PUT";
    url: string;
    headers: {
      "content-type": string;
    };
  };
}

export function AdminUploadField({ productId }: AdminUploadFieldProps) {
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function uploadImage() {
    if (!file) {
      setError("Choose an image first.");
      return;
    }

    setError(null);
    setMessage("Requesting signed upload URL...");
    setIsUploading(true);

    try {
      const presign = await apiRequest<PresignResponse>(
        "/api/v1/admin/media/presign-upload",
        {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            byteSize: file.size,
            purpose: "PRODUCT_IMAGE",
          }),
        },
      );

      setMessage("Uploading image to storage...");
      const uploadResponse = await fetch(presign.upload.url, {
        method: presign.upload.method,
        headers: presign.upload.headers,
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Storage upload failed.");
      }

      setMessage("Completing media record...");
      await apiRequest(`/api/v1/admin/media/${presign.mediaAsset.id}/complete`, {
        method: "POST",
        body: JSON.stringify({
          publicUrl: presign.mediaAsset.publicUrl ?? undefined,
        }),
      });

      await apiRequest(`/api/v1/admin/products/${productId}/images`, {
        method: "POST",
        body: JSON.stringify({
          mediaAssetId: presign.mediaAsset.id,
          altText: altText || null,
          isPrimary: true,
        }),
      });

      setMessage("Image uploaded and attached. Refresh to see it in the gallery.");
      setFile(null);
      setAltText("");
    } catch {
      setError(
        "Image upload failed. Check R2 configuration, file type, size, and admin permission.",
      );
      setMessage(null);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div>
        <h2 className="m-0 text-lg font-bold">Product image</h2>
        <p className="m-0 mt-1 text-sm text-[var(--color-text-muted)]">
          Uses the backend signed upload flow. Allowed image formats and file
          size are enforced by the backend.
        </p>
      </div>
      {error ? <p className="m-0 text-sm font-semibold text-[var(--color-danger)]">{error}</p> : null}
      {message ? <p className="m-0 text-sm font-semibold text-[var(--color-success)]">{message}</p> : null}
      <Input
        accept="image/jpeg,image/png,image/webp,image/avif"
        label="Image file"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        type="file"
      />
      <Input
        label="Alt text"
        onChange={(event) => setAltText(event.target.value)}
        value={altText}
      />
      <Button
        icon={<Upload className="h-4 w-4" aria-hidden="true" />}
        loading={isUploading}
        onClick={uploadImage}
        variant="secondary"
      >
        Upload image
      </Button>
    </section>
  );
}
