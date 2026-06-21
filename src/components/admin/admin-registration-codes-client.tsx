"use client";

import { Clipboard, RefreshCcw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getAdminRegistrationCodes,
  getApiErrorMessage,
  rotateAdminRegistrationCodes,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminRegistrationCodePanel } from "@/types/domain";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not rotated yet";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminRegistrationCodesClient() {
  const [panel, setPanel] = useState<AdminRegistrationCodePanel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    getAdminRegistrationCodes()
      .then((data) => {
        setPanel(data);
        setError(null);
      })
      .catch((loadError) =>
        setError(
          getApiErrorMessage(
            loadError,
            "Admin registration codes are restricted to super admins.",
          ),
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  async function copyCode(code: string, label: string) {
    await navigator.clipboard.writeText(code);
    setMessage(`${label} code copied.`);
  }

  async function rotateCodes() {
    setIsRotating(true);
    setError(null);
    setMessage(null);

    try {
      const rotatedPanel = await rotateAdminRegistrationCodes();
      setPanel(rotatedPanel);
      setMessage("Admin registration codes regenerated. Old role codes are now invalid.");
      setConfirmOpen(false);
    } catch (rotationError) {
      setError(
        getApiErrorMessage(
          rotationError,
          "Codes could not be regenerated. Check your permission and try again.",
        ),
      );
    } finally {
      setIsRotating(false);
    }
  }

  if (isLoading) {
    return (
      <section className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-28 w-full" />
      </section>
    );
  }

  return (
    <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="m-0 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Super-admin secret panel
          </p>
          <h2 className="m-0 mt-2 text-xl font-extrabold">
            Admin registration codes
          </h2>
          <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            Role codes are generated server-side from the env secret and the
            database rotation version. The env secret is never shown here.
          </p>
        </div>
        <Button
          icon={<RefreshCcw className="h-4 w-4" aria-hidden="true" />}
          onClick={() => setConfirmOpen(true)}
          variant="secondary"
        >
          Regenerate
        </Button>
      </div>

      {error ? (
        <ErrorState description={error} title="Codes unavailable" />
      ) : null}
      {message ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success)]">
          {message}
        </p>
      ) : null}

      {panel ? (
        <>
          <dl className="grid gap-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-bold text-[var(--color-text)]">Version</dt>
              <dd className="m-0 text-[var(--color-text-muted)]">
                {panel.version}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--color-text)]">Expires</dt>
              <dd className="m-0 text-[var(--color-text-muted)]">
                {formatDateTime(panel.expiresAt)}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-[var(--color-text)]">
                Last regenerated
              </dt>
              <dd className="m-0 text-[var(--color-text-muted)]">
                {formatDateTime(panel.rotatedAt)}
              </dd>
            </div>
          </dl>

          <div className="grid gap-3 sm:grid-cols-2">
            {panel.codes.map((item) => (
              <article
                className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3"
                key={item.role}
              >
                <div>
                  <h3 className="m-0 text-base font-bold">{item.label}</h3>
                  <p className="m-0 mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    {item.role.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <code className="rounded-[var(--radius-sm)] bg-[var(--color-canvas)] px-3 py-2 text-lg font-extrabold tracking-[0.16em] text-[var(--color-text)]">
                    {item.code}
                  </code>
                  <Button
                    icon={<Clipboard className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => copyCode(item.code, item.label)}
                    size="sm"
                    variant="ghost"
                  >
                    Copy
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}

      <ConfirmDialog
        confirmLabel="Regenerate codes"
        description="This immediately invalidates the current admin registration codes for every role. Existing admin accounts are not affected."
        loading={isRotating}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={rotateCodes}
        open={confirmOpen}
        title="Regenerate admin registration codes?"
      >
        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          This updates only the database rotation version. It does not change
          ADMIN_REGISTRATION_CODE_SECRET and does not require a redeploy.
        </p>
      </ConfirmDialog>
    </section>
  );
}
