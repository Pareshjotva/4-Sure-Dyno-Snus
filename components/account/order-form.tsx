"use client";

import { Button } from "@/components/ui/button";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VolumeProgress } from "@/components/orders/volume-progress";
import type { FieldErrors } from "@/lib/form-errors";
import type { IncentiveTier } from "@/lib/types";
import { quoteCumulativeDiscount } from "@/lib/volume-discount";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type ProductOption = {
  id: string;
  name: string;
  image: string;
};

export function OrderForm({
  products,
  defaultProvince,
  minOrderPacks,
  pendingNotice = "",
  tiers,
  monthPacks,
  monthSubtotal = 0,
  previouslyGranted = 0,
}: {
  products: ProductOption[];
  defaultProvince: string;
  minOrderPacks: number;
  pendingNotice?: string;
  tiers: IncentiveTier[];
  monthPacks: number;
  monthSubtotal?: number;
  previouslyGranted?: number;
}) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(products.map((p) => [p.id, 0]))
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const packCount = useMemo(
    () => Object.values(qty).reduce((a, b) => a + (b || 0), 0),
    [qty]
  );
  const subtotal = packCount * 40;
  const quote = quoteCumulativeDiscount({
    orderPacks: packCount,
    orderSubtotal: subtotal,
    monthPacksBefore: monthPacks,
    monthSubtotalBefore: monthSubtotal,
    previouslyGranted,
    tiers,
  });
  const sortedTiers = [...tiers].sort((a, b) => a.minPacks - b.minPacks);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const next: FieldErrors = {};
    for (const product of products) {
      const amount = qty[product.id] || 0;
      if (!Number.isInteger(amount)) {
        next[`qty_${product.id}`] = "Enter a whole number of packs.";
      } else if (amount < 0) {
        next[`qty_${product.id}`] = "Quantity cannot be negative.";
      } else if (amount > 500) {
        next[`qty_${product.id}`] = "Quantity cannot be more than 500 packs.";
      }
    }
    const form = new FormData(e.currentTarget);
    const items = products
      .filter((p) => (qty[p.id] || 0) > 0)
      .map((p) => ({ productId: p.id, quantity: qty[p.id] }));

    if (items.length === 0) {
      next.items = "Add at least one product.";
    } else if (packCount < minOrderPacks) {
      next.packs = `Minimum order is ${minOrderPacks} packs (50 g).`;
    }
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    const ok = await confirmAction(
      `Place this order for ${packCount} packs?`,
      { confirmLabel: "Yes, place order" }
    );
    if (!ok) return;

    setErrors({});
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        province: form.get("province"),
        notes: form.get("notes"),
        items,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErrors(json.fieldErrors || {});
      setFormError(
        json.fieldErrors ? "" : json.error || "Could not place the order. Try again."
      );
      return;
    }
    router.push("/account/orders");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <VolumeProgress
        monthPacks={monthPacks}
        thisOrderPacks={packCount}
        tiers={tiers}
      />

      <div className="surface space-y-4 rounded-2xl p-5">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/8 pb-4 last:border-0 last:pb-0"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {product.image ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist sm:h-16 sm:w-20">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ) : null}
              <div className="min-w-0">
                <p className="font-semibold text-navy">{product.name}</p>
                <p className="text-xs text-navy/55">$40.00 / 50 g pack</p>
              </div>
            </div>
            <div>
              <Input
                type="number"
                min={0}
                max={500}
                className="w-28"
                value={qty[product.id] || 0}
                onChange={(e) =>
                  setQty((prev) => ({
                    ...prev,
                    [product.id]: Number(e.target.value || 0),
                  }))
                }
              />
              <FieldError message={errors[`qty_${product.id}`]} />
            </div>
          </div>
        ))}
        <FieldError message={errors.items} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Ship-to province
          </label>
          <Select name="province" defaultValue={defaultProvince || "BC"}>
            <option value="BC">British Columbia</option>
            <option value="AB">Alberta</option>
            <option value="ON">Ontario</option>
          </Select>
          <FieldError message={errors.province} />
        </div>
        <div className="surface rounded-xl p-4 text-sm">
          <p>
            Earlier this month: <strong>{monthPacks} packs</strong>
          </p>
          <p className="mt-1">
            This order: <strong>{packCount} packs</strong> (min {minOrderPacks}{" "}
            for free shipping)
          </p>
          <p className="mt-1">
            Counted together: <strong>{quote.qualifyingPacks} packs</strong>
            {quote.tier
              ? ` · ${quote.tier.name} ${quote.discountPercent}%`
              : " · no volume discount yet"}
          </p>
          <p className="mt-1">
            Subtotal: <strong>${subtotal.toFixed(2)}</strong>
          </p>
          <p
            className={`mt-1 ${quote.discountAmount > 0 ? "font-semibold text-cyan" : ""}`}
          >
            Discount on this order:{" "}
            <strong>−${quote.discountAmount.toFixed(2)}</strong>
          </p>
          <p
            className={`mt-1 ${quote.discountAdjustment > 0 ? "font-semibold text-cyan" : ""}`}
          >
            Prior-order adjustment:{" "}
            <strong>−${quote.discountAdjustment.toFixed(2)}</strong>
          </p>
          <p className="mt-1 text-xs text-navy/70">
            Already granted this month: ${previouslyGranted.toFixed(2)} · month
            target at current slab: ${quote.finalMonthlyDiscount.toFixed(2)}
          </p>
          <p className="mt-1 font-semibold">
            Payable: ${quote.total.toFixed(2)}
          </p>
          <ul className="mt-3 space-y-1 text-xs text-navy/70">
            <li>1–{sortedTiers[0] ? sortedTiers[0].minPacks - 1 : 19} packs · 0%</li>
            {sortedTiers.map((tier) => (
              <li key={tier.id}>
                {tier.maxPacks == null
                  ? `${tier.minPacks}+ packs`
                  : `${tier.minPacks}–${tier.maxPacks} packs`}{" "}
                · {tier.name} · {tier.discountPercent}% off
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-navy/60">
            Catch-up credit is applied on this invoice only. Earlier invoices
            keep the discount they already received. Totals reset each calendar
            month.
          </p>
          <FieldError message={errors.packs} />
        </div>
      </div>

      {pendingNotice && (
        <p className="rounded-xl border border-warn-yellow/40 bg-warn-yellow/10 px-4 py-3 text-sm text-warn-yellow">
          {pendingNotice}
        </p>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
          Notes
        </label>
        <Textarea name="notes" placeholder="Delivery notes, preferred timing…" />
      </div>

      {formError && (
        <p className="text-sm text-warn-red" role="alert">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting…" : "Submit order"}
      </Button>
    </form>
  );
}
