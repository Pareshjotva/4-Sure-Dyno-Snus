"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProvincePricing } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminPricingClient({
  pricing,
  productNames,
}: {
  pricing: ProvincePricing[];
  productNames: Record<string, string>;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(pricing);
  const [saving, setSaving] = useState<string | null>(null);

  async function save(row: ProvincePricing) {
    setSaving(row.id);
    await fetch(`/api/admin/pricing/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wholesale: row.wholesale,
        ptt: row.ptt,
        msrpMin: row.msrpMin,
        msrpMax: row.msrpMax,
        marginMin: row.marginMin,
        marginMax: row.marginMax,
      }),
    });
    setSaving(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {rows.map((row, index) => (
        <div key={row.id} className="surface flex h-full flex-col rounded-2xl p-5">
          <p className="font-semibold text-navy">
            {row.province} · {productNames[row.productId] || row.productId}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["wholesale", "Wholesale"],
                ["ptt", "PTT"],
                ["msrpMin", "MSRP min"],
                ["msrpMax", "MSRP max"],
                ["marginMin", "Margin min %"],
                ["marginMax", "Margin max %"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-navy/60">
                  {label}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={row[key]}
                  onChange={(e) => {
                    const next = [...rows];
                    next[index] = {
                      ...row,
                      [key]: Number(e.target.value),
                    };
                    setRows(next);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-auto pt-4">
            <Button
              size="sm"
              onClick={() => save(row)}
              disabled={saving === row.id}
            >
              {saving === row.id ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
