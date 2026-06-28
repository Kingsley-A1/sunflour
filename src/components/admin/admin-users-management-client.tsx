"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  getApiErrorMessage,
  removeUserAccount,
  updateUserAccountStatus,
  type AdminUserAccount,
  type CustomerUserAccount,
  type UserAccountsResponse,
} from "@/lib/api/client";

interface AdminUsersManagementClientProps {
  initialAdminUsers: AdminUserAccount[];
  initialCustomerUsers: CustomerUserAccount[];
  currentUserId: string;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

// Mirrors the server heuristic: a suspension locks sign-in far into the future,
// well beyond the short automatic lockout used for failed logins.
function isSuspended(lockedUntil: string | null): boolean {
  return (
    Boolean(lockedUntil) &&
    new Date(lockedUntil as string).getTime() >
      Date.now() + 365 * 24 * 60 * 60 * 1000
  );
}

export function AdminUsersManagementClient({
  initialAdminUsers,
  initialCustomerUsers,
  currentUserId,
}: AdminUsersManagementClientProps) {
  const [adminUsers, setAdminUsers] = useState(initialAdminUsers);
  const [customerUsers, setCustomerUsers] = useState(initialCustomerUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function applyResponse(response: UserAccountsResponse) {
    setAdminUsers(response.adminUsers);
    setCustomerUsers(response.customerUsers);
  }

  async function changeStatus(
    userId: string,
    action: "suspend" | "reactivate",
    label: string,
  ) {
    setBusyId(userId);
    setError(null);
    setMessage(null);

    try {
      applyResponse(await updateUserAccountStatus({ userId, action }));
      setMessage(
        action === "suspend"
          ? `${label} suspended. A notice email was queued to their inbox.`
          : `${label} reactivated. A notice email was queued.`,
      );
    } catch (actionError) {
      setError(getApiErrorMessage(actionError, "Could not update the account."));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    setMessage(null);

    try {
      applyResponse(await removeUserAccount({ userId: deleteTarget.id }));
      setMessage(
        `${deleteTarget.label} removed. A notice email with a recovery contact was queued.`,
      );
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Could not remove the account."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="grid gap-4">
      {error ? (
        <p
          className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm font-semibold text-[var(--color-danger-text)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success-text)]"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold">Staff accounts</h2>
          <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            Suspend blocks sign-in immediately and is reversible. Delete removes
            the account permanently. Both notify the person by email with a
            recovery contact.
          </p>
        </div>

        {adminUsers.length > 0 ? (
          <ul className="m-0 grid list-none gap-3 p-0">
            {adminUsers.map((adminUser) => {
              const account = adminUser.user;
              const suspended =
                adminUser.status === "SUSPENDED" ||
                isSuspended(account.lockedUntil);
              const isSelf = account.id === currentUserId;
              const label = account.name ?? account.email ?? "this admin";

              return (
                <li
                  className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 lg:grid-cols-[1.4fr_0.9fr_auto] lg:items-center"
                  key={adminUser.id}
                >
                  <div className="min-w-0">
                    <p className="m-0 text-base font-bold">
                      {account.name ?? "Unnamed admin"}
                      {isSelf ? (
                        <span className="ml-2 text-xs font-semibold text-[var(--color-text-muted)]">
                          (you)
                        </span>
                      ) : null}
                    </p>
                    <p className="m-0 mt-1 break-all text-sm text-[var(--color-text-muted)]">
                      {account.email ?? "No email on file"}
                    </p>
                    <p className="m-0 mt-1 text-xs text-[var(--color-text-muted)]">
                      Last login: {formatDateTime(account.lastLoginAt)}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="m-0 font-semibold capitalize">
                      {adminUser.role.replaceAll("_", " ").toLowerCase()}
                    </p>
                    <StatusText suspended={suspended} />
                  </div>
                  <AccountActions
                    busy={busyId === account.id || isDeleting}
                    isSelf={isSelf}
                    onDelete={() => setDeleteTarget({ id: account.id, label })}
                    onReactivate={() =>
                      changeStatus(account.id, "reactivate", label)
                    }
                    onSuspend={() => changeStatus(account.id, "suspend", label)}
                    suspended={suspended}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-muted)]">
            No admin profiles exist yet.
          </p>
        )}
      </div>

      <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold">Customer accounts</h2>
          <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            The {customerUsers.length} most recent customer accounts. Past orders
            are preserved even when an account is removed.
          </p>
        </div>

        {customerUsers.length > 0 ? (
          <ul className="m-0 grid list-none gap-3 p-0">
            {customerUsers.map((customer) => {
              const suspended = isSuspended(customer.lockedUntil);
              const label = customer.name ?? customer.email ?? "this customer";

              return (
                <li
                  className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3 lg:grid-cols-[1.4fr_0.9fr_auto] lg:items-center"
                  key={customer.id}
                >
                  <div className="min-w-0">
                    <p className="m-0 text-base font-bold">
                      {customer.name ?? "Unnamed customer"}
                    </p>
                    <p className="m-0 mt-1 break-all text-sm text-[var(--color-text-muted)]">
                      {customer.email ?? "No email on file"}
                    </p>
                    <p className="m-0 mt-1 text-xs text-[var(--color-text-muted)]">
                      Last login: {formatDateTime(customer.lastLoginAt)}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="m-0 font-semibold text-[var(--color-text-muted)]">
                      Customer
                    </p>
                    <StatusText suspended={suspended} />
                  </div>
                  <AccountActions
                    busy={busyId === customer.id || isDeleting}
                    isSelf={false}
                    onDelete={() =>
                      setDeleteTarget({ id: customer.id, label })
                    }
                    onReactivate={() =>
                      changeStatus(customer.id, "reactivate", label)
                    }
                    onSuspend={() =>
                      changeStatus(customer.id, "suspend", label)
                    }
                    suspended={suspended}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-muted)]">
            No customer accounts yet.
          </p>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete account"
        description={`This permanently removes ${deleteTarget?.label ?? "this account"}. Their past orders are kept, but the account, profile, and sign-in access are deleted. They will be emailed a recovery contact.`}
        destructive
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleteTarget)}
        title="Delete this account?"
      />
    </section>
  );
}

function StatusText({ suspended }: { suspended: boolean }) {
  return (
    <p
      className={
        suspended
          ? "m-0 mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-danger-text)]"
          : "m-0 mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-success-text)]"
      }
    >
      {suspended ? "Suspended" : "Active"}
    </p>
  );
}

function AccountActions({
  busy,
  isSelf,
  suspended,
  onSuspend,
  onReactivate,
  onDelete,
}: {
  busy: boolean;
  isSelf: boolean;
  suspended: boolean;
  onSuspend: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}) {
  if (isSelf) {
    return (
      <p className="m-0 text-xs font-semibold text-[var(--color-text-muted)]">
        No actions on your own account
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {suspended ? (
        <Button
          disabled={busy}
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          onClick={onReactivate}
          size="sm"
          variant="secondary"
        >
          Reactivate
        </Button>
      ) : (
        <Button
          disabled={busy}
          icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
          onClick={onSuspend}
          size="sm"
          variant="secondary"
        >
          Suspend
        </Button>
      )}
      <Button
        disabled={busy}
        icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
        onClick={onDelete}
        size="sm"
        variant="danger"
      >
        Delete
      </Button>
    </div>
  );
}
