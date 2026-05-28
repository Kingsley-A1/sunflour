"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const notify = useCallback((message: string, tone: ToastTone = "info") => {
    const id = crypto.randomUUID();
    setMessages((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setMessages((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-2"
      >
        {messages.map((toast) => (
          <div
            className={cn(
              "flex items-start gap-3 rounded-[var(--radius-md)] border bg-[var(--color-surface)] p-3 text-sm shadow-[var(--shadow-card)]",
              toast.tone === "success" && "border-[var(--color-success)]",
              toast.tone === "error" && "border-[var(--color-danger)]",
              toast.tone === "info" && "border-[var(--color-focus)]",
            )}
            key={toast.id}
          >
            {toast.tone === "success" ? (
              <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--color-success)]" aria-hidden="true" />
            ) : null}
            {toast.tone === "error" ? (
              <XCircle className="mt-0.5 h-4 w-4 text-[var(--color-danger)]" aria-hidden="true" />
            ) : null}
            {toast.tone === "info" ? (
              <Info className="mt-0.5 h-4 w-4 text-[var(--color-focus)]" aria-hidden="true" />
            ) : null}
            <p className="m-0 text-[var(--color-text)]">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
