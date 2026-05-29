"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAdminDeliveryZone,
  createAdminSurchargeRule,
  getApiErrorMessage,
  listAdminDeliveryZones,
  listAdminSurchargeRules,
  updateAdminDeliveryZone,
  updateAdminSurchargeRule,
} from "@/lib/api/client";
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
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneDraft, setZoneDraft] = useState({
    name: "",
    baseFee: "",
    isActive: true,
  });
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleDraft, setRuleDraft] = useState({
    name: "",
    startsAtTime: "18:00",
    amount: "",
    isActive: true,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setError(null);
    try {
      const [zoneData, ruleData] = await Promise.all([
        listAdminDeliveryZones(),
        listAdminSurchargeRules(),
      ]);
      setZones(zoneData);
      setRules(ruleData);
    } catch (settingsError) {
      setError(
        getApiErrorMessage(
          settingsError,
          "Delivery settings are restricted to super admins or the backend is unavailable.",
        ),
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([listAdminDeliveryZones(), listAdminSurchargeRules()])
      .then(([zoneData, ruleData]) => {
        if (!cancelled) {
          setZones(zoneData);
          setRules(ruleData);
        }
      })
      .catch((settingsError) => {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              settingsError,
              "Delivery settings are restricted to super admins or the backend is unavailable.",
            ),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function createZone() {
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      await createAdminDeliveryZone({
        name: zoneName,
        baseFee: nairaInputToKobo(zoneFee),
        isActive: true,
      });
      setMessage("Delivery zone created. Refreshing settings...");
      setZoneName("");
      setZoneFee("");
      await loadSettings();
    } catch (zoneError) {
      setError(
        getApiErrorMessage(
          zoneError,
          "Delivery zone could not be created. Check values and permission.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function createRule() {
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      await createAdminSurchargeRule({
        name: ruleName,
        startsAtTime: ruleStartsAt,
        amount: nairaInputToKobo(ruleAmount),
        isActive: true,
      });
      setMessage("Surcharge rule created. Refreshing settings...");
      setRuleName("");
      setRuleStartsAt("");
      setRuleAmount("");
      await loadSettings();
    } catch (ruleError) {
      setError(
        getApiErrorMessage(
          ruleError,
          "Surcharge rule could not be created. Use HH:MM time and valid amount.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startZoneEdit(zone: AdminDeliveryZone) {
    setEditingZoneId(zone.id);
    setZoneDraft({
      name: zone.name,
      baseFee: String(zone.baseFee / 100),
      isActive: zone.isActive,
    });
  }

  async function saveZoneEdit(zoneId: string) {
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      await updateAdminDeliveryZone(zoneId, {
        name: zoneDraft.name,
        baseFee: nairaInputToKobo(zoneDraft.baseFee),
        isActive: zoneDraft.isActive,
      });
      setEditingZoneId(null);
      setMessage("Delivery zone updated. Checkout will use this setting for new quotes.");
      await loadSettings();
    } catch (zoneError) {
      setError(getApiErrorMessage(zoneError, "Delivery zone update failed."));
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleZone(zone: AdminDeliveryZone) {
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      await updateAdminDeliveryZone(zone.id, {
        isActive: !zone.isActive,
      });
      setMessage(
        zone.isActive
          ? "Delivery zone deactivated. It will not appear at checkout."
          : "Delivery zone reactivated for checkout.",
      );
      await loadSettings();
    } catch (zoneError) {
      setError(getApiErrorMessage(zoneError, "Delivery zone state update failed."));
    } finally {
      setIsSaving(false);
    }
  }

  function startRuleEdit(rule: AdminSurchargeRule) {
    setEditingRuleId(rule.id);
    setRuleDraft({
      name: rule.name,
      startsAtTime: rule.startsAtTime,
      amount: String(rule.amount / 100),
      isActive: rule.isActive,
    });
  }

  async function saveRuleEdit(ruleId: string) {
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      await updateAdminSurchargeRule(ruleId, {
        name: ruleDraft.name,
        startsAtTime: ruleDraft.startsAtTime,
        amount: nairaInputToKobo(ruleDraft.amount),
        isActive: ruleDraft.isActive,
      });
      setEditingRuleId(null);
      setMessage("Surcharge rule updated. New delivery quotes will use the latest rule.");
      await loadSettings();
    } catch (ruleError) {
      setError(getApiErrorMessage(ruleError, "Surcharge rule update failed."));
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleRule(rule: AdminSurchargeRule) {
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      await updateAdminSurchargeRule(rule.id, {
        isActive: !rule.isActive,
      });
      setMessage(
        rule.isActive
          ? "Surcharge rule deactivated."
          : "Surcharge rule reactivated.",
      );
      await loadSettings();
    } catch (ruleError) {
      setError(getApiErrorMessage(ruleError, "Surcharge rule state update failed."));
    } finally {
      setIsSaving(false);
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
          <Button loading={isSaving} onClick={createZone}>Create zone</Button>
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
          <Button loading={isSaving} onClick={createRule}>Create rule</Button>
        </section>
      </div>
      <section className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-surface-soft)]">
            <tr>
              <th className="p-3">Zone</th>
              <th className="p-3">Base fee</th>
              <th className="p-3">State</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr className="border-t border-[var(--color-border)]" key={zone.id}>
                <td className="p-3 font-semibold">
                  {editingZoneId === zone.id ? (
                    <Input
                      label="Zone name"
                      onChange={(event) =>
                        setZoneDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      value={zoneDraft.name}
                    />
                  ) : (
                    zone.name
                  )}
                </td>
                <td className="p-3">
                  {editingZoneId === zone.id ? (
                    <Input
                      inputMode="decimal"
                      label="Base fee in naira"
                      onChange={(event) =>
                        setZoneDraft((current) => ({
                          ...current,
                          baseFee: event.target.value,
                        }))
                      }
                      value={zoneDraft.baseFee}
                    />
                  ) : (
                    formatNairaFromKobo(zone.baseFee)
                  )}
                </td>
                <td className="p-3">
                  {editingZoneId === zone.id ? (
                    <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
                      <input
                        checked={zoneDraft.isActive}
                        onChange={(event) =>
                          setZoneDraft((current) => ({
                            ...current,
                            isActive: event.target.checked,
                          }))
                        }
                        type="checkbox"
                      />
                      Active
                    </label>
                  ) : (
                    <StatusPill status={zone.isActive ? "ACTIVE" : "HIDDEN"} />
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {editingZoneId === zone.id ? (
                      <>
                        <Button
                          loading={isSaving}
                          onClick={() => saveZoneEdit(zone.id)}
                          size="sm"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingZoneId(null)}
                          size="sm"
                          variant="secondary"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => startZoneEdit(zone)} size="sm" variant="secondary">
                          Edit
                        </Button>
                        <Button
                          loading={isSaving}
                          onClick={() => toggleZone(zone)}
                          size="sm"
                          variant="secondary"
                        >
                          {zone.isActive ? "Deactivate" : "Reactivate"}
                        </Button>
                      </>
                    )}
                  </div>
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
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr className="border-t border-[var(--color-border)]" key={rule.id}>
                <td className="p-3 font-semibold">
                  {editingRuleId === rule.id ? (
                    <Input
                      label="Rule name"
                      onChange={(event) =>
                        setRuleDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      value={ruleDraft.name}
                    />
                  ) : (
                    rule.name
                  )}
                </td>
                <td className="p-3">
                  {editingRuleId === rule.id ? (
                    <Input
                      label="Starts at time"
                      onChange={(event) =>
                        setRuleDraft((current) => ({
                          ...current,
                          startsAtTime: event.target.value,
                        }))
                      }
                      value={ruleDraft.startsAtTime}
                    />
                  ) : (
                    rule.startsAtTime
                  )}
                </td>
                <td className="p-3">
                  {editingRuleId === rule.id ? (
                    <Input
                      inputMode="decimal"
                      label="Amount in naira"
                      onChange={(event) =>
                        setRuleDraft((current) => ({
                          ...current,
                          amount: event.target.value,
                        }))
                      }
                      value={ruleDraft.amount}
                    />
                  ) : (
                    formatNairaFromKobo(rule.amount)
                  )}
                </td>
                <td className="p-3">
                  {editingRuleId === rule.id ? (
                    <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
                      <input
                        checked={ruleDraft.isActive}
                        onChange={(event) =>
                          setRuleDraft((current) => ({
                            ...current,
                            isActive: event.target.checked,
                          }))
                        }
                        type="checkbox"
                      />
                      Active
                    </label>
                  ) : (
                    <StatusPill status={rule.isActive ? "ACTIVE" : "HIDDEN"} />
                  )}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {editingRuleId === rule.id ? (
                      <>
                        <Button
                          loading={isSaving}
                          onClick={() => saveRuleEdit(rule.id)}
                          size="sm"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingRuleId(null)}
                          size="sm"
                          variant="secondary"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => startRuleEdit(rule)} size="sm" variant="secondary">
                          Edit
                        </Button>
                        <Button
                          loading={isSaving}
                          onClick={() => toggleRule(rule)}
                          size="sm"
                          variant="secondary"
                        >
                          {rule.isActive ? "Deactivate" : "Reactivate"}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
