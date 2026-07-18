"use client";

import { useEffect, useState } from "react";
import { listEmailTemplates } from "@/lib/api/client";
import { ErrorState } from "@/components/ui/error-state";
import { StatusPill } from "@/components/ui/status-pill";
import type { EmailTemplate } from "@/types/domain";

export function EmailSettingsClient() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEmailTemplates()
      .then(setTemplates)
      .catch(() =>
        setError("Email template settings are unavailable for this account."),
      );
  }, []);

  return (
    <div className="grid gap-5">
      {error ? <ErrorState description={error} title="Email settings issue" /> : null}
      <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="m-0 text-xl font-bold">Transactional templates</h2>
        <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
          Sunflour email controls are transactional only. Campaigns,
          newsletters, birthday offers, and marketing automation are not part of
          v1.
        </p>
      </section>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead className="bg-[var(--color-surface-muted)]">
            <tr>
              <th className="w-full p-3">Template</th>
              <th className="p-3">Subject</th>
              <th className="p-3">State</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr className="border-t border-[var(--color-border)]" key={template.id}>
                <td className="p-3 font-semibold">{template.name}</td>
                <td className="p-3 text-[var(--color-text-muted)]">{template.subject}</td>
                <td className="p-3">
                  <StatusPill status={template.isActive ? "ACTIVE" : "HIDDEN"} />
                </td>
              </tr>
            ))}
            {templates.length === 0 ? (
              <tr>
                <td className="p-3 text-[var(--color-text-muted)]" colSpan={3}>
                  No templates returned by the backend.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
