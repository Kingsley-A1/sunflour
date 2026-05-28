"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/client";
import { formatNairaFromKobo, nairaInputToKobo } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import type { AdminDeliveryZone, AdminSurchargeRule } from "@/types/domain";

export function DeliverySettingsClient() {
  const [zones, setZones] = useState<AdminDeliveryZone[]>([]);
  const [rules, setRules] = useState<AdminSurchargeRule[]>([]);
  const [zoneName, setZoneName] = useState("");
  const [zoneFee, setZoneFee] = useState("");
  const [ruleName, setRuleName] = useState("");
  const [ruleStartsAt, setRuleStartsAt] = useState("");
  const [ruleAmount, setRuleAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    setError(null);
    try {
      const [zoneData, ruleData] = await Promise.all([
        apiRequest<{ zones: AdminDeliveryZone[] }>("/api/v1/admin/delivery/zones"),
        apiRequest<{ surchargeRules: AdminSurchargeRule[] }>(
          "/api/v1/admin/delivery/surcharge-rules",
        ),
      ]);
      setZones(zoneData.zones);
      setRules(ruleData.surchargeRules);
    } catch {
      setError(
        "Delivery settings are restricted to super admins or the backend is unavailable.",
      );
    }
  }

  useEffect(() => {
    async function loadInitialSettings() {
      try {
        const [zoneData, ruleData] = await Promise.all([
          apiRequest<{ zones: AdminDeliveryZone[] }>(
            "/api/v1/admin/delivery/zones",
          ),
          apiRequest<{ surchargeRules: AdminSurchargeRule[] }>(
            "/api/v1/admin/delivery/surcharge-rules",
          ),
        ]);
        setZones(zoneData.zones);
        setRules(ruleData.surchargeRules);
      } catch {
        setError(
          "Delivery settings are restricted to super admins or the backend is unavailable.",
        );
      }
    }

    void loadInitialSettings();
  }, []);

  async function createZone() {
    setError(null);
    setMessage(null);

    try {
      await apiRequest("/api/v1/admin/delivery/zones", {
        method: "POST",
        body: JSON.stringify({
          name: zoneName,
          baseFee: nairaInputToKobo(zoneFee),
          isActive: true,
        }),
      });
      setMessage("Delivery zone created. Refreshing settings...");
      setZoneName("");
      setZoneFee("");
      await loadSettings();
    } catch {
      setError("Delivery zone could not be created. Check values and permission.");
    }
  }

  async function createRule() {
    setError(null);
    setMessage(null);

    try {
      await apiRequest("/api/v1/admin/delivery/surcharge-rules", {
        method: "POST",
        body: JSON.stringify({
          name: ruleName,
          startsAtTime: ruleStartsAt,
          amount: nairaInputToKobo(ruleAmount),
          isActive: true,
        }),
      });
      setMessage("Surcharge rule created. Refreshing settings...");
      setRuleName("");
      setRuleStartsAt("");
      setRuleAmount("");
      await loadSettings();
    } catch {
      setError("Surcharge rule could not be created. Use HH:MM time and valid amount.");
    }
  }

  return (
    <div className="grid gap-5">
      {error ? <ErrorState description={error} title="Delivery settings issue" /> : null}
      {message ? (
        <p className="m-0 rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-soft)] p-3 text-sm font-semibold text-[var(--color-success)]">
          {message}
        </p>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="m-0 text-lg font-bold">Create delivery zone</h2>
          <Input label="Zone name" onChange={(event) => setZoneName(event.target.value)} value={zoneName} />
          <Input
            inputMode="decimal"
            label="Base fee in naira"
            onChange={(event) => setZoneFee(event.target.value)}
            value={zoneFee}
          />
          <Button onClick={createZone}>Create zone</Button>
        </section>
        <section className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="m-0 text-lg font-bold">Create surcharge rule</h2>
          <p className="m-0 text-sm leading-6 text-[var(--color-text-muted)]">
            Use backend-managed time and amount. Checkout displays base fee and
            surcharge separately.
          </p>
          <Input label="Rule name" onChange={(event) => setRuleName(event.target.value)} value={ruleName} />
          <Input
            label="Starts at time"
            onChange={(event) => setRuleStartsAt(event.target.value)}
            placeholder="18:00"
            value={ruleStartsAt}
          />
          <Input
            inputMode="decimal"
            label="Amount in naira"
            onChange={(event) => setRuleAmount(event.target.value)}
            value={ruleAmount}
          />
          <Button onClick={createRule}>Create rule</Button>
        </section>
      </div>
      <section className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-surface-soft)]">
            <tr>
              <th className="p-3">Zone</th>
              <th className="p-3">Base fee</th>
              <th className="p-3">State</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr className="border-t border-[var(--color-border)]" key={zone.id}>
                <td className="p-3 font-semibold">{zone.name}</td>
                <td className="p-3">{formatNairaFromKobo(zone.baseFee)}</td>
                <td className="p-3">
                  <StatusPill status={zone.isActive ? "ACTIVE" : "HIDDEN"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-surface-soft)]">
            <tr>
              <th className="p-3">Rule</th>
              <th className="p-3">Starts</th>
              <th className="p-3">Amount</th>
              <th className="p-3">State</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr className="border-t border-[var(--color-border)]" key={rule.id}>
                <td className="p-3 font-semibold">{rule.name}</td>
                <td className="p-3">{rule.startsAtTime}</td>
                <td className="p-3">{formatNairaFromKobo(rule.amount)}</td>
                <td className="p-3">
                  <StatusPill status={rule.isActive ? "ACTIVE" : "HIDDEN"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
