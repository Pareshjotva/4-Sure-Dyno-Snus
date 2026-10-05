"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type ProductOption = {
  id: string;
  name: string;
};

export function OrderForm({
  products,
  defaultProvince,
  minOrderPacks,
}: {
  products: ProductOption[];
  defaultProvince: string;
  minOrderPacks: number;
}) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(products.map((p) => [p.id, 0]))
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const packCount = useMemo(
    () => Object.values(qty).reduce((a, b) => a + (b || 0), 0),
    [qty]
  );
  const subtotal = packCount * 40;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const items = products
      .filter((p) => (qty[p.id] || 0) > 0)
      .map((p) => ({ productId: p.id, quantity: qty[p.id] }));

    if (items.length === 0) {
      setError("Add at least one product.");
      return;
    }

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
      setError(json.error || "Order failed");
      return;
    }
    router.push("/account/orders");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="surface space-y-4 rounded-2xl p-5">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/8 pb-4 last:border-0 last:pb-0"
          >
            <div>
              <p className="font-semibold text-navy">{product.name}</p>
              <p className="text-xs text-navy/55">$40.00 / 50 g pack</p>
            </div>
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
          </div>
        ))}
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
        </div>
        <div className="surface rounded-xl p-4 text-sm">
          <p>
            Packs: <strong>{packCount}</strong> (min {minOrderPacks} for free
            shipping)
          </p>
          <p className="mt-1">
            Subtotal before incentives: <strong>${subtotal.toFixed(2)}</strong>
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
          Notes
        </label>
        <Textarea name="notes" placeholder="Delivery notes, preferred timing…" />
      </div>

      {error && <p className="text-sm text-warn-red">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting…" : "Submit order"}
      </Button>
    </form>
  );
}
