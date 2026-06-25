"use client";

import { useEffect, useState } from "react";
import {
  getApiErrorMessage,
  getPaymentSettings,
  updatePaymentSettings,
} from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PaymentSettings } from "@/types/domain";

export function PaymentSettingsClient() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [instruction, setInstruction] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    getPaymentSettings()
      .then((data) => {
        if (!data) {
          return;
        }

        setSettings(data);
        setBankName(data.bankName);
        setAccountName(data.accountName);
        setAccountNumber(data.accountNumber);
        setInstruction(data.paymentInstruction);
        setWhatsappNumber(data.proofWhatsappNumber);
        setIsActive(data.isActive);
      })
      .catch(() =>
        setError("Payment settings are restricted to super admins."),
      );
  }, []);

  async function saveSettings() {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await updatePaymentSettings({
        bankName,
        accountName,
        accountNumber,
        paymentInstruction: instruction,
        proofWhatsappNumber: whatsappNumber,
        isActive,
      });
      setSettings(updated);
      setMessage("Payment settings saved. New orders will snapshot the latest active instruction.");
      setConfirmOpen(false);
      setIsEditing(false);
    } catch (settingsError) {
      setError(
        getApiErrorMessage(
          settingsError,
          "Payment settings could not be saved. Check values and permission.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-5">
      {error ? <ErrorState description={error} title="Restricted or unavailable" /> : null}
      {message ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success)]" role="status">
          {message}
        </p>
      ) : null}
      {!isEditing ? (
        <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="m-0 text-xl font-bold">Moniepoint transfer settings</h2>
              <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                Future orders use this active payment instruction snapshot.
                Existing orders and invoices do not change.
              </p>
            </div>
            <Button onClick={() => setIsEditing(true)} variant="secondary">
              Edit payment settings
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryItem label="Bank" value={bankName || "Not set"} />
            <SummaryItem label="Account name" value={accountName || "Not set"} />
            <SummaryItem label="Account number" value={accountNumber || "Not set"} />
            <SummaryItem label="Status" value={isActive ? "Active" : "Inactive"} />
          </div>
        </section>
      ) : (
      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div>
          <h2 className="m-0 text-xl font-bold">Moniepoint transfer settings</h2>
          <p className="m-0 mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            Super-admin only. Existing orders keep their payment instruction
            snapshots after this setting changes.
          </p>
        </div>
        <Input label="Bank name" onChange={(event) => setBankName(event.target.value)} value={bankName} />
        <Input label="Account name" onChange={(event) => setAccountName(event.target.value)} value={accountName} />
        <Input label="Account number" onChange={(event) => setAccountNumber(event.target.value)} value={accountNumber} />
        <Textarea label="Payment instruction" onChange={(event) => setInstruction(event.target.value)} value={instruction} />
        <Input label="Proof WhatsApp number" onChange={(event) => setWhatsappNumber(event.target.value)} value={whatsappNumber} />
        <Checkbox
          checked={isActive}
          label="Payment settings active"
          onChange={(event) => setIsActive(event.target.checked)}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => setConfirmOpen(true)}>Review and save</Button>
          <Button onClick={() => setIsEditing(false)} variant="secondary">
            Cancel
          </Button>
        </div>
      </section>
      )}
      <ConfirmDialog
        confirmLabel="Save settings"
        description="This changes the payment instruction snapshot used by future orders. Old invoices and old order snapshots will not change."
        loading={isSaving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={saveSettings}
        open={confirmOpen}
        title="Confirm payment settings update"
      >
        <p className="m-0 text-sm text-[var(--color-text-muted)]">
          Current saved setting: {settings?.bankName ?? "none"}
        </p>
      </ConfirmDialog>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <p className="m-0 text-sm font-semibold text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="m-0 mt-2 break-words text-sm font-bold">{value}</p>
    </div>
  );
}
