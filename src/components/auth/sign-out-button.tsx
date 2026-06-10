"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  className?: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function SignOutButton({
  className,
  label = "Sign out",
  variant = "secondary",
}: SignOutButtonProps) {
  return (
    <Button
      className={className}
      icon={<LogOut className="h-4 w-4" aria-hidden="true" />}
      onClick={() => signOut({ callbackUrl: "/" })}
      variant={variant}
    >
      {label}
    </Button>
  );
}
