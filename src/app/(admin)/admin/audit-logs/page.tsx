import Link from "next/link";
import type { Route } from "next";
import { formatDateTime } from "@/lib/formatters";
import { requireRole } from "@/server/auth/rbac";
import { SUPER_ADMIN_ROLES } from "@/server/auth/roles";
import {
  auditLogListQuerySchema,
  listAuditLogsForAdmin,
} from "@/server/modules/audit";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Audit Logs",
};

interface AdminAuditLogsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildPageHref(
  input: {
    action?: string;
    targetType?: string;
    pageSize: number;
  },
  page: number,
): Route {
  const searchParams = new URLSearchParams();

  if (input.action) {
    searchParams.set("action", input.action);
  }

  if (input.targetType) {
    searchParams.set("targetType", input.targetType);
  }

  searchParams.set("page", String(page));
  searchParams.set("pageSize", String(input.pageSize));

  return `/admin/audit-logs?${searchParams.toString()}` as Route;
}

function formatMetadata(metadata: unknown): string {
  if (!metadata) {
    return "No metadata";
  }

  return JSON.stringify(metadata, null, 2);
}

export default async function AdminAuditLogsPage({
  searchParams,
}: AdminAuditLogsPageProps) {
  await requireRole(SUPER_ADMIN_ROLES);
  const query = await searchParams;
  const input = auditLogListQuerySchema.parse({
    action: first(query.action),
    targetType: first(query.targetType),
    targetId: first(query.targetId),
    actorUserId: first(query.actorUserId),
    createdFrom: first(query.createdFrom),
    createdTo: first(query.createdTo),
    page: first(query.page),
    pageSize: first(query.pageSize) ?? "25",
  });
  const { auditLogs, pagination } = await listAuditLogsForAdmin(input);
  const previousPage = Math.max(1, pagination.page - 1);
  const nextPage = Math.min(
    pagination.pageCount || 1,
    pagination.page + 1,
  );

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
          Audit
        </p>
        <h1 className="m-0 mt-2 text-3xl font-extrabold">Audit logs</h1>
        <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
          Super-admin view of critical business changes. Sensitive metadata is
          redacted by the backend before it reaches this page.
        </p>
      </header>

      <form
        action="/admin/audit-logs"
        className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-[1fr_1fr_auto]"
      >
        <label className="grid gap-2 text-sm font-semibold">
          Action
          <input
            className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
            defaultValue={input.action ?? ""}
            name="action"
            placeholder="ORDER_STATUS_UPDATE"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Target type
          <input
            className="min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
            defaultValue={input.targetType ?? ""}
            name="targetType"
            placeholder="order"
          />
        </label>
        <button
          className="min-h-11 self-end rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-on-primary)]"
          type="submit"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-[56rem] text-left text-sm">
          <thead className="bg-[var(--color-surface-muted)]">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Target</th>
              <th className="p-3">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((auditLog) => (
              <tr
                className="border-t border-[var(--color-border)] align-top"
                key={auditLog.id}
              >
                <td className="whitespace-nowrap p-3">
                  {formatDateTime(auditLog.createdAt)}
                </td>
                <td className="p-3">
                  {auditLog.actor?.email ??
                    auditLog.actor?.name ??
                    auditLog.actorUserId ??
                    "System"}
                </td>
                <td className="p-3 font-semibold">{auditLog.action}</td>
                <td className="p-3">
                  <span className="font-semibold">{auditLog.targetType}</span>
                  {auditLog.targetId ? (
                    <span className="block text-[var(--color-text-muted)]">
                      {auditLog.targetId}
                    </span>
                  ) : null}
                </td>
                <td className="p-3">
                  <pre className="m-0 max-w-md overflow-x-auto whitespace-pre-wrap rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-2 text-xs leading-5">
                    {formatMetadata(auditLog.metadata)}
                  </pre>
                </td>
              </tr>
            ))}
            {auditLogs.length === 0 ? (
              <tr>
                <td className="p-3 text-[var(--color-text-muted)]" colSpan={5}>
                  No audit logs match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Audit log pagination"
        className="flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <p className="m-0 text-[var(--color-text-muted)]">
          Page {pagination.page} of {pagination.pageCount || 1}. Total logs:{" "}
          {pagination.total}.
        </p>
        <div className="flex gap-2">
          <Link
            aria-disabled={pagination.page <= 1}
            className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-50"
            href={buildPageHref(input, previousPage)}
          >
            Previous
          </Link>
          <Link
            aria-disabled={pagination.page >= (pagination.pageCount || 1)}
            className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-50"
            href={buildPageHref(input, nextPage)}
          >
            Next
          </Link>
        </div>
      </nav>
    </div>
  );
}
