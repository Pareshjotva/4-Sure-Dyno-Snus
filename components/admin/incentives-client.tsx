"use client";

import { Button } from "@/components/ui/button";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import type { IncentiveTier } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

function emptyTier(index: number): IncentiveTier {
  return {
    id: `tier_${Date.now()}_${index}`,
    name: `Tier ${index + 1}`,
    minPacks: 0,
    maxPacks: null,
    discountPercent: 0,
    savePerPack: 0,
  };
}

export function AdminIncentivesClient({ tiers }: { tiers: IncentiveTier[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(
    [...tiers].sort((a, b) => a.minPacks - b.minPacks)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(index: number, patch: Partial<IncentiveTier>) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  async function save() {
    const ok = await confirmAction(
      "Save these volume discount slabs for all retailers?",
      { confirmLabel: "Yes, save slabs" }
    );
    if (!ok) return;
    setSaving(true);
    setMessage("");
    setError("");
    const res = await fetch("/api/admin/incentives", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tiers: rows.map((row) => ({
          ...row,
          maxPacks:
            row.maxPacks === null || Number.isNaN(Number(row.maxPacks))
              ? null
              : Number(row.maxPacks),
        })),
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error || "Could not save slabs.");
      return;
    }
    setRows(json.tiers);
    setMessage("Discount slabs saved.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-ink">
        Slabs apply to each retailer&apos;s cumulative pack count in the current
        calendar month. When a higher slab unlocks, catch-up credit for earlier
        orders is applied on the new order — prior invoices are not rewritten.
      </p>

      {rows.map((row, index) => (
        <div key={row.id} className="surface rounded-2xl p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-navy/60">
                Name
              </label>
              <Input
                value={row.name}
                onChange={(e) => update(index, { name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-navy/60">
                Min packs
              </label>
              <Input
                type="number"
                min={0}
                value={row.minPacks}
                onChange={(e) =>
                  update(index, { minPacks: Number(e.target.value || 0) })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-navy/60">
                Max packs
              </label>
              <Input
                type="number"
                min={0}
                placeholder="Open"
                value={row.maxPacks ?? ""}
                onChange={(e) =>
                  update(index, {
                    maxPacks:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-navy/60">
                Discount %
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={row.discountPercent}
                onChange={(e) =>
                  update(index, {
                    discountPercent: Number(e.target.value || 0),
                  })
                }
              />
            </div>
          </div>
          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={rows.length <= 1}
              onClick={async () => {
                const ok = await confirmAction("Remove this discount slab?", {
                  danger: true,
                  confirmLabel: "Yes, remove",
                });
                if (!ok) return;
                setRows((current) => current.filter((_, i) => i !== index));
              }}
            >
              Remove slab
            </Button>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRows((current) => [...current, emptyTier(current.length)])}
        >
          Add slab
        </Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save slabs"}
        </Button>
      </div>
      {message && <p className="text-sm text-cyan">{message}</p>}
      {error && (
        <p className="text-sm text-warn-red" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
