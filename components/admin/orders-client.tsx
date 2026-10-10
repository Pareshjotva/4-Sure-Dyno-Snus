"use client";

import { OrderItemList } from "@/components/orders/order-item-list";
import { OrderTotals } from "@/components/orders/order-totals";
import { Select } from "@/components/ui/select";
import {
  ORDER_STATUSES,
  isInvoiceAvailable,
  orderStatusLabel,
} from "@/lib/orders";
import { PROFILE_STATUS_LABEL } from "@/lib/profile-status";
import type { Order, OrderStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminOrderRow = Order & { verificationLabel?: string };

export function AdminOrdersClient({
  orders,
  images,
}: {
  orders: AdminOrderRow[];
  images: Record<string, string>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unverified">("all");
  const visible =
    filter === "unverified"
      ? orders.filter((order) => order.profileVerificationStatus !== "verified")
      : orders;

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
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === "all" ? "bg-cyan text-white" : "bg-white/10 text-white"}`}
          onClick={() => setFilter("all")}
        >
          All orders
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === "unverified" ? "bg-cyan text-white" : "bg-white/10 text-white"}`}
          onClick={() => setFilter("unverified")}
        >
          Unverified profiles
        </button>
      </div>
      {visible.map((order) => {
        const statusValue =
          order.status === "confirmed" ? "accepted" : order.status;
        return (
          <article key={order.id} className="surface rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">{order.orderNumber}</p>
                <p className="text-xs text-navy/60">
                  {order.company || order.userName} · {order.province} ·{" "}
                  {formatDate(order.createdAt)}
                </p>
                {order.profileVerificationStatus &&
                  order.profileVerificationStatus !== "verified" && (
                    <p className="mt-2 text-sm font-semibold text-warn-yellow">
                      Pending Profile Verification — this customer&apos;s profile
                      and license have not been verified (
                      {order.verificationLabel ||
                        PROFILE_STATUS_LABEL[order.profileVerificationStatus]}
                      ).
                    </p>
                  )}
              </div>
            </div>
            <OrderItemList
              orderId={order.id}
              items={order.items}
              images={images}
              showPrice={false}
            />
            <OrderTotals order={order} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={`/admin/orders/${order.id}`}
                className="text-sm font-semibold text-cyan"
              >
                Edit order
              </Link>
              {isInvoiceAvailable(order.status) ? (
                <Link
                  href={`/admin/orders/${order.id}/invoice`}
                  className="text-sm font-semibold text-cyan"
                >
                  Invoice
                </Link>
              ) : (
                <span className="text-xs text-white/45">
                  Invoice after accept
                </span>
              )}
              <Select
                className="w-44"
                value={statusValue}
                disabled={busy === order.id}
                onChange={(e) =>
                  updateStatus(order.id, e.target.value as OrderStatus)
                }
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusLabel(s)}
                  </option>
                ))}
              </Select>
              {busy === order.id && (
                <span className="text-xs text-cyan">Saving…</span>
              )}
            </div>
          </article>
        );
      })}
      {visible.length === 0 && (
        <p className="text-sm text-slate-ink">No orders yet.</p>
      )}
    </div>
  );
}
