"use client";

import { Button } from "@/components/ui/button";
import { GoogleLogo } from "@/components/ui/google-logo";
import { cn } from "@/lib/utils";

interface GoogleAuthButtonProps {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void | Promise<void>;
}

export function GoogleAuthButton({
  className,
  disabled,
  loading,
  onClick,
}: GoogleAuthButtonProps) {
  return (
    <Button
      className={cn(
        "w-full justify-center border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-none hover:bg-[var(--color-surface-muted)]",
        className,
      )}
      disabled={disabled}
      icon={<GoogleLogo aria-hidden="true" />}
      loading={loading}
      onClick={() => {
        void onClick();
      }}
      size="lg"
      variant="secondary"
    >
      {loading ? "Connecting to Google..." : "Continue with Google"}
    </Button>
  );
}
