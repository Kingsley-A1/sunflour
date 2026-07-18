"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  className?: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "danger-outline";
}

export function SignOutButton({
  className,
  label = "Sign out",
  // Signing out ends the session, so it reads as a distinct exit action rather
  // than sharing the neutral styling of navigation buttons beside it.
  variant = "danger-outline",
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
