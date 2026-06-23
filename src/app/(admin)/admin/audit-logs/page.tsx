import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
    actorUserId?: string;
    targetId?: string;
    targetType?: string;
    pageSize: number;
  },
  page: number,
): Route {
  const searchParams = new URLSearchParams();

  if (input.action) {
    searchParams.set("action", input.action);
  }

  if (input.actorUserId) {
    searchParams.set("actorUserId", input.actorUserId);
  }

  if (input.targetType) {
    searchParams.set("targetType", input.targetType);
  }

  if (input.targetId) {
    searchParams.set("targetId", input.targetId);
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

function formatActor(auditLog: {
  actor?: { email: string | null; name: string | null; role: string | null } | null;
  actorUserId: string | null;
}): string {
  return (
    auditLog.actor?.email ??
    auditLog.actor?.name ??
    auditLog.actorUserId ??
    "System"
  );
}

function countAppliedFilters(input: {
  action?: string;
  actorUserId?: string;
  targetId?: string;
  targetType?: string;
}): number {
  return [
    input.action,
    input.actorUserId,
    input.targetId,
    input.targetType,
  ].filter(Boolean).length;
}

const pageSizeOptions = ["25", "50", "100"] as const;

export default async function AdminAuditLogsPage({
  searchParams,
}: AdminAuditLogsPageProps) {
  await requireRole(SUPER_ADMIN_ROLES);
  const query = await searchParams;
  const parsedInput = auditLogListQuerySchema.safeParse({
    action: first(query.action),
    targetType: first(query.targetType),
    targetId: first(query.targetId),
    actorUserId: first(query.actorUserId),
    createdFrom: first(query.createdFrom),
    createdTo: first(query.createdTo),
    page: first(query.page),
    pageSize: first(query.pageSize) ?? "25",
  });
  const input = parsedInput.success
    ? parsedInput.data
    : auditLogListQuerySchema.parse({ page: "1", pageSize: "25" });
  const { auditLogs, pagination } = await listAuditLogsForAdmin(input);
  const previousPage = Math.max(1, pagination.page - 1);
  const nextPage = Math.min(pagination.pageCount || 1, pagination.page + 1);
  const appliedFilters = countAppliedFilters(input);
  const hasFilters = appliedFilters > 0;

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]">
        <div>
          <p className="m-0 text-sm font-bold text-[var(--color-primary)]">
            Governance
          </p>
          <h1 className="m-0 mt-2 text-3xl font-extrabold">Audit logs</h1>
          <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Review critical business changes across catalog, delivery, payment,
            reviews, and order operations. Sensitive metadata is already
            redacted before it reaches this page.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Total logs" value={String(pagination.total)} />
          <SummaryCard label="Applied filters" value={String(appliedFilters)} />
          <SummaryCard
            label="Current page"
            value={`${pagination.page}/${pagination.pageCount || 1}`}
          />
        </div>
      </header>

      <form
        action="/admin/audit-logs"
        className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]"
      >
        {!parsedInput.success ? (
          <p
            className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-3 text-sm font-semibold text-[var(--color-warning)]"
            role="status"
          >
            Some audit filters were invalid and have been reset.
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Input
            defaultValue={input.action ?? ""}
            label="Action"
            name="action"
            placeholder="ORDER_STATUS_UPDATE"
          />
          <Input
            defaultValue={input.targetType ?? ""}
            label="Target type"
            name="targetType"
            placeholder="order"
          />
          <Input
            defaultValue={input.targetId ?? ""}
            label="Target ID"
            name="targetId"
            placeholder="ord_123"
          />
          <Input
            defaultValue={input.actorUserId ?? ""}
            label="Actor user ID"
            name="actorUserId"
            placeholder="usr_123"
          />
          <Select
            defaultValue={String(input.pageSize)}
            label="Rows per page"
            name="pageSize"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} rows
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 text-sm text-[var(--color-text-muted)]">
            Use exact values when tracing a specific operational change.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {hasFilters ? (
              <Link
                className="inline-flex min-h-[var(--control-height-md)] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                href="/admin/audit-logs"
              >
                Clear filters
              </Link>
            ) : null}
            <Button type="submit">Apply filters</Button>
          </div>
        </div>
      </form>

      {auditLogs.length === 0 ? (
        <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
          No audit logs match the current filters.
        </section>
      ) : (
        <>
          <section className="grid gap-4 lg:hidden">
            {auditLogs.map((auditLog) => (
              <article
                className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)]"
                key={auditLog.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 text-sm text-[var(--color-text-muted)]">
                      {formatDateTime(auditLog.createdAt)}
                    </p>
                    <h2 className="m-0 mt-1 break-words text-base font-bold">
                      {auditLog.action}
                    </h2>
                  </div>
                  <p className="m-0 rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                    {auditLog.targetType}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailBlock label="Actor" value={formatActor(auditLog)} />
                  <DetailBlock
                    label="Target"
                    value={auditLog.targetId ?? "No target ID"}
                  />
                </div>
                <div className="grid gap-2">
                  <p className="m-0 text-sm font-semibold">Metadata</p>
                  <pre className="m-0 max-h-64 overflow-auto rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-3 text-xs leading-5 text-[var(--color-text-muted)]">
                    {formatMetadata(auditLog.metadata)}
                  </pre>
                </div>
              </article>
            ))}
          </section>

          <section className="hidden overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-raised)] lg:block">
            <table className="min-w-[68rem] text-left text-sm">
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
                      <p className="m-0 font-semibold">{formatActor(auditLog)}</p>
                      {auditLog.actor?.role ? (
                        <p className="m-0 mt-1 text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                          {auditLog.actor.role.replaceAll("_", " ")}
                        </p>
                      ) : null}
                    </td>
                    <td className="p-3 font-semibold">{auditLog.action}</td>
                    <td className="p-3">
                      <span className="font-semibold">{auditLog.targetType}</span>
                      {auditLog.targetId ? (
                        <span className="mt-1 block text-[var(--color-text-muted)]">
                          {auditLog.targetId}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3">
                      <pre className="m-0 max-w-xl overflow-auto whitespace-pre-wrap rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] p-3 text-xs leading-5 text-[var(--color-text-muted)]">
                        {formatMetadata(auditLog.metadata)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <nav
        aria-label="Audit log pagination"
        className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-raised)] sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          Page {pagination.page} of {pagination.pageCount || 1}. Total logs:{" "}
          {pagination.total}.
        </p>
        <div className="flex gap-2">
          <Link
            aria-disabled={pagination.page <= 1}
            className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-50"
            href={buildPageHref(input, previousPage)}
          >
            Previous
          </Link>
          <Link
            aria-disabled={pagination.page >= (pagination.pageCount || 1)}
            className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-sm font-semibold aria-disabled:pointer-events-none aria-disabled:opacity-50"
            href={buildPageHref(input, nextPage)}
          >
            Next
          </Link>
        </div>
      </nav>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <p className="m-0 text-sm text-[var(--color-text-muted)]">{label}</p>
      <p className="m-0 mt-2 text-2xl font-extrabold">{value}</p>
    </article>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="m-0 mt-2 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}
