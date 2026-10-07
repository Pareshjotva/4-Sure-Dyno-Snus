"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/lib/form-errors";
import { licenceNumberSchema } from "@/lib/form-schemas";
import { quoteVolumeDiscount } from "@/lib/site";
import type { IncentiveTier } from "@/lib/types";
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
  needsLicence,
  tiers,
  monthPacks,
}: {
  products: ProductOption[];
  defaultProvince: string;
  minOrderPacks: number;
  needsLicence: boolean;
  tiers: IncentiveTier[];
  monthPacks: number;
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
  const quote = quoteVolumeDiscount(packCount, monthPacks, tiers, subtotal);
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
    let licenceNumber = "";
    if (needsLicence) {
      const parsed = licenceNumberSchema.safeParse(
        String(form.get("licenceNumber") || "")
      );
      if (!parsed.success) {
        next.licenceNumber =
          parsed.error.issues[0]?.message || "Enter the tobacco licence number.";
      } else {
        licenceNumber = parsed.data;
      }
    }
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

    setErrors({});
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        province: form.get("province"),
        notes: form.get("notes"),
        ...(needsLicence ? { licenceNumber } : {}),
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
            This order: <strong>{packCount} packs</strong> (min {minOrderPacks}{" "}
            for free shipping)
          </p>
          <p className="mt-1">
            Already this month: <strong>{monthPacks} packs</strong>
          </p>
          <p className="mt-1">
            Qualifying volume: <strong>{quote.qualifyingPacks} packs</strong>
          </p>
          <p className="mt-1">
            Subtotal: <strong>${subtotal.toFixed(2)}</strong>
          </p>
          <p className={`mt-1 ${quote.discountPercent > 0 ? "font-semibold text-cyan" : ""}`}>
            Discount:{" "}
            <strong>
              {quote.tier
                ? `${quote.tier.name} ${quote.discountPercent}% (−$${quote.discountAmount.toFixed(2)})`
                : "$0.00"}
            </strong>
          </p>
          <p className="mt-1 font-semibold">
            Total: ${quote.total.toFixed(2)}
          </p>
          <ul className="mt-3 space-y-1 text-xs text-navy/70">
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
            One order can qualify on its own, or this month’s orders add
            together. Last month’s packs do not carry forward.
          </p>
          <FieldError message={errors.packs} />
        </div>
      </div>

      {needsLicence && (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Tobacco licence #
          </label>
          <Input name="licenceNumber" placeholder="Required to place this order" />
          <FieldError message={errors.licenceNumber} />
          <p className="mt-1 text-xs text-white/55">
            Required once. After this order it stays on your profile.
          </p>
        </div>
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
