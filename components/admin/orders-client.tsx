"use client";

import { OrderItemList } from "@/components/orders/order-item-list";
import { OrderTotals } from "@/components/orders/order-totals";
import { Select } from "@/components/ui/select";
import type { Order, OrderStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const statuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export function AdminOrdersClient({
  orders,
  images,
}: {
  orders: Order[];
  images: Record<string, string>;
}) {
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {orders.map((order) => (
        <article key={order.id} className="surface flex h-full flex-col rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-navy">{order.orderNumber}</p>
              <p className="text-xs text-navy/60">
                {order.company || order.userName} · {order.province} ·{" "}
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <OrderItemList
            orderId={order.id}
            items={order.items}
            images={images}
            showPrice={false}
          />
          <OrderTotals order={order} />
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
            <Link
              href={`/admin/orders/${order.id}/invoice`}
              className="text-sm font-semibold text-cyan"
            >
              Invoice
            </Link>
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
