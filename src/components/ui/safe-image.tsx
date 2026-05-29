"use client";

import { useState } from "react";
import Image from "next/image";
import type { ImageProps } from "next/image";
import type { ReactNode } from "react";

interface SafeImageProps extends ImageProps {
  fallback: ReactNode;
}

export function SafeImage({ alt, fallback, onError, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    <Image
      {...props}
      alt={alt}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
