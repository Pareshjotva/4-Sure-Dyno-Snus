"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUSES, isInvoiceAvailable, orderStatusLabel } from "@/lib/orders";
import type { Order, OrderItem, OrderStatus, Product } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type LineDraft = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  pttUnit: number;
  description: string;
};

export function AdminOrderEditForm({
  order,
  products,
  pricingPtt,
}: {
  order: Order;
  products: Product[];
  pricingPtt: Record<string, number>;
}) {
  const router = useRouter();
  const overrides = order.invoiceOverrides;
  const [status, setStatus] = useState<OrderStatus>(
    order.status === "confirmed" ? "accepted" : order.status
  );
  const [province, setProvince] = useState(order.province);
  const [notes, setNotes] = useState(order.notes || "");
  const [discountPercent, setDiscountPercent] = useState(order.discountPercent || 0);
  const [discountTier, setDiscountTier] = useState(order.discountTier || "");
  const [billToName, setBillToName] = useState(
    overrides?.billToName || order.company || order.userName
  );
  const [billToAddress, setBillToAddress] = useState(overrides?.billToAddress || "");
  const [billToPhone, setBillToPhone] = useState(overrides?.billToPhone || "");
  const [shipToName, setShipToName] = useState(
    overrides?.shipToName || order.company || order.userName
  );
  const [shipToAddress, setShipToAddress] = useState(overrides?.shipToAddress || "");
  const [shipToPhone, setShipToPhone] = useState(overrides?.shipToPhone || "");
  const [lines, setLines] = useState<LineDraft[]>(() =>
    order.items.map((item) => {
      const override = overrides?.lines.find((l) => l.productId === item.productId);
      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        pttUnit: override?.pttUnit ?? pricingPtt[item.productId] ?? 0,
        description: override?.description || item.productName,
      };
    })
  );
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);

  const packCount = useMemo(
    () => lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
    [lines]
  );
  const subtotal = useMemo(
    () =>
      Math.round(
        lines.reduce(
          (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0),
          0
        ) * 100
      ) / 100,
    [lines]
  );
  const discountAmount =
    Math.round(subtotal * (Math.max(0, discountPercent) / 100) * 100) / 100;
  const total = Math.round((subtotal - discountAmount) * 100) / 100;

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  }

  function addProduct(productId: string) {
    if (!productId) return;
    if (lines.some((line) => line.productId === productId)) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setLines((current) => [
      ...current,
      {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: 40,
        pttUnit: pricingPtt[product.id] ?? 0,
        description: product.name,
      },
    ]);
  }

  function removeLine(index: number) {
    setLines((current) => current.filter((_, i) => i !== index));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldError("");
    if (lines.length === 0) {
      setFieldError("Add at least one line item.");
      return;
    }
    for (const line of lines) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        setFieldError("Each line needs a whole quantity of at least 1.");
        return;
      }
      if (line.unitPrice < 0 || line.pttUnit < 0) {
        setFieldError("Prices and PTT cannot be negative.");
        return;
      }
    }

    setSaving(true);
    const items: OrderItem[] = lines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    }));
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: {
          status,
          province,
          notes,
          discountPercent,
          discountTier,
          items,
          billToName,
          billToAddress,
          billToPhone,
          shipToName,
          shipToAddress,
          shipToPhone,
          lines: lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            pttUnit: line.pttUnit,
          })),
        },
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Could not save the order.");
      return;
    }
    router.refresh();
  }

  const unusedProducts = products.filter(
    (p) => p.active && !lines.some((line) => line.productId === p.id)
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-cyan">
            {order.orderNumber}
          </p>
          <h1 className="font-display text-3xl text-navy">Edit order</h1>
          <p className="mt-1 text-sm text-slate-ink">
            {order.company || order.userName} · current status{" "}
            {orderStatusLabel(order.status)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isInvoiceAvailable(order.status) ? (
            <Link href={`/admin/orders/${order.id}/invoice`}>
              <Button type="button" variant="outline">
                Invoice
              </Button>
            </Link>
          ) : (
            <span className="self-center text-xs text-white/45">
              Invoice after accept
            </span>
          )}
          <Link href="/admin/orders">
            <Button type="button" variant="ghost">
              Back to orders
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Status
          </label>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Province
          </label>
          <Select value={province} onChange={(e) => setProvince(e.target.value)}>
            <option value="BC">British Columbia</option>
            <option value="AB">Alberta</option>
            <option value="ON">Ontario</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Discount %
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value || 0))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Discount tier label
          </label>
          <Input
            value={discountTier}
            onChange={(e) => setDiscountTier(e.target.value)}
            placeholder="Tier 1 · Growth"
          />
        </div>
      </div>

      <div className="surface rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-white">Line items</h2>
          {unusedProducts.length > 0 && (
            <Select
              className="w-56"
              defaultValue=""
              onChange={(e) => {
                addProduct(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">Add product…</option>
              {unusedProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
        </div>
        <div className="space-y-4">
          {lines.map((line, index) => (
            <div
              key={line.productId}
              className="grid gap-3 border-b border-white/10 pb-4 last:border-0 last:pb-0 sm:grid-cols-2 lg:grid-cols-6"
            >
              <div className="lg:col-span-2">
                <label className="mb-1 block text-xs text-white/55">Description</label>
                <Input
                  value={line.description}
                  onChange={(e) =>
                    updateLine(index, {
                      description: e.target.value,
                      productName: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/55">Qty</label>
                <Input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(index, { quantity: Number(e.target.value || 0) })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/55">Unit price</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(e) =>
                    updateLine(index, { unitPrice: Number(e.target.value || 0) })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/55">PTT / unit</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.pttUnit}
                  onChange={(e) =>
                    updateLine(index, { pttUnit: Number(e.target.value || 0) })
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeLine(index)}
                  disabled={lines.length <= 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
        <FieldError message={fieldError} />
        <p className="mt-4 text-sm text-white/70">
          Packs: <strong className="text-white">{packCount}</strong> · Subtotal:{" "}
          <strong className="text-white">${subtotal.toFixed(2)}</strong> · Discount:{" "}
          <strong className="text-white">−${discountAmount.toFixed(2)}</strong> ·
          Total: <strong className="text-white">${total.toFixed(2)}</strong>
        </p>
        <p className="mt-1 text-xs text-white/45">
          Admin edits are not limited by the retailer 20-pack minimum.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface space-y-3 rounded-2xl p-5">
          <h2 className="font-display text-xl text-white">Bill to</h2>
          <Input
            value={billToName}
            onChange={(e) => setBillToName(e.target.value)}
            placeholder="Name"
          />
          <Textarea
            value={billToAddress}
            onChange={(e) => setBillToAddress(e.target.value)}
            placeholder="Address"
            rows={3}
          />
          <Input
            value={billToPhone}
            onChange={(e) => setBillToPhone(e.target.value)}
            placeholder="Phone"
          />
        </div>
        <div className="surface space-y-3 rounded-2xl p-5">
          <h2 className="font-display text-xl text-white">Ship to</h2>
          <Input
            value={shipToName}
            onChange={(e) => setShipToName(e.target.value)}
            placeholder="Name"
          />
          <Textarea
            value={shipToAddress}
            onChange={(e) => setShipToAddress(e.target.value)}
            placeholder="Address"
            rows={3}
          />
          <Input
            value={shipToPhone}
            onChange={(e) => setShipToPhone(e.target.value)}
            placeholder="Phone"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
          Notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {error && (
        <p className="text-sm text-warn-red" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save order"}
      </Button>
    </form>
  );
}
