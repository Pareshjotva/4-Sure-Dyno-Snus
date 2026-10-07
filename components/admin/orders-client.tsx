"use client";

import { OrderTotals } from "@/components/orders/order-totals";
import { Select } from "@/components/ui/select";
import type { Order, OrderStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

const statuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export function AdminOrdersClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function updateStatus(id: string, status: OrderStatus) {
    setBusy(id);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article key={order.id} className="surface rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-navy">{order.orderNumber}</p>
              <p className="text-xs text-navy/60">
                {order.company || order.userName} · {order.province} ·{" "}
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-slate-ink">
            {order.items.map((item) => (
              <li key={`${order.id}-${item.productId}`}>
                {item.productName} × {item.quantity}
              </li>
            ))}
          </ul>
          <OrderTotals order={order} />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Select
              className="w-44"
              value={order.status}
              disabled={busy === order.id}
              onChange={(e) =>
                updateStatus(order.id, e.target.value as OrderStatus)
              }
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            {busy === order.id && (
              <span className="text-xs text-cyan">Saving…</span>
            )}
          </div>
        </article>
      ))}
      {orders.length === 0 && (
        <p className="text-sm text-slate-ink">No orders yet.</p>
      )}
    </div>
  );
}
