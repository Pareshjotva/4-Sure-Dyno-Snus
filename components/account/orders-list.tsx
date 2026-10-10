"use client";

import { OrderItemList } from "@/components/orders/order-item-list";
import { OrderTotals } from "@/components/orders/order-totals";
import { FilterBar, matchesQuery } from "@/components/ui/filter-bar";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUSES, isInvoiceAvailable, orderStatusLabel } from "@/lib/orders";
import type { Order } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export function AccountOrdersList({
  orders,
  images,
}: {
  orders: Order[];
  images: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const visible = orders.filter((order) => {
    const current = order.status === "confirmed" ? "accepted" : order.status;
    if (status && current !== status) return false;
    return matchesQuery(query, order.orderNumber, order.province, order.notes);
  });

  return (
    <div className="mt-6 space-y-4">
      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search order number"
        status={status}
        onStatus={setStatus}
        statuses={ORDER_STATUSES.map((item) => ({
          value: item,
          label: orderStatusLabel(item),
        }))}
      />
      {visible.map((order) => (
        <article key={order.id} className="surface rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-navy">{order.orderNumber}</p>
              <p className="text-xs text-navy/60">
                {formatDate(order.createdAt)} · {order.province}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isInvoiceAvailable(order.status) ? (
                <Link
                  href={`/account/orders/${order.id}/invoice`}
                  className="text-sm font-semibold text-cyan"
                >
                  Invoice
                </Link>
              ) : (
                <span className="text-xs text-white/45">Invoice after acceptance</span>
              )}
              <Badge>{orderStatusLabel(order.status)}</Badge>
            </div>
          </div>
          <OrderItemList orderId={order.id} items={order.items} images={images} />
          <OrderTotals order={order} />
          {order.notes && <p className="mt-2 text-xs text-navy/55">{order.notes}</p>}
        </article>
      ))}
      {visible.length === 0 && (
        <p className="text-sm text-slate-ink">
          {orders.length === 0 ? "No orders yet." : "Nothing matches this filter."}
        </p>
      )}
    </div>
  );
}
