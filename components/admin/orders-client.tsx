"use client";

import {
  BulkArchiveBar,
  ListSelectCheckbox,
  TrashAction,
  TrashBinButton,
  setTrash,
  setTrashMany,
  useListSelection,
} from "@/components/admin/trash-bin";
import { OrderItemList } from "@/components/orders/order-item-list";
import { OrderTotals } from "@/components/orders/order-totals";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { FilterBar, matchesQuery } from "@/components/ui/filter-bar";
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
import { useMemo, useState } from "react";

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
  const [bulkBusy, setBulkBusy] = useState(false);
  const [rows, setRows] = useState(orders);
  const [bin, setBin] = useState(false);
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const pool = rows.filter((order) => (bin ? order.trashedAt : !order.trashedAt));
  const visible = pool.filter((order) => {
    if (filter === "verified" && order.profileVerificationStatus !== "verified") {
      return false;
    }
    if (filter === "unverified" && order.profileVerificationStatus === "verified") {
      return false;
    }
    const current = order.status === "confirmed" ? "accepted" : order.status;
    if (status && current !== status) return false;
    return matchesQuery(
      query,
      order.orderNumber,
      order.company,
      order.userName,
      order.province
    );
  });
  const visibleIds = useMemo(() => visible.map((order) => order.id), [visible]);
  const selection = useListSelection(visibleIds);

  async function updateStatus(id: string, status: OrderStatus) {
    const ok = await confirmAction(
      `Update this order status to "${orderStatusLabel(status)}"?`,
      { confirmLabel: "Yes, update status" }
    );
    if (!ok) return;
    setBusy(id);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  async function onTrash(id: string, restore = false) {
    if (
      !restore &&
      !(await confirmAction("Archive this order?", {
        danger: true,
        confirmLabel: "Yes, archive",
      }))
    ) {
      return;
    }
    setBusy(id);
    try {
      await setTrash("order", id, restore);
    } catch {
      setBusy(null);
      return;
    }
    setBusy(null);
    const stamp = restore ? null : new Date().toISOString();
    setRows((current) =>
      current.map((order) => (order.id === id ? { ...order, trashedAt: stamp } : order))
    );
    selection.removeIds([id]);
  }

  async function onBulk(restore: boolean) {
    const ids = selection.selectedVisible;
    if (!ids.length) return;
    const ok = await confirmAction(
      restore
        ? `Restore ${ids.length} selected order${ids.length === 1 ? "" : "s"}?`
        : `Archive ${ids.length} selected order${ids.length === 1 ? "" : "s"}?`,
      {
        danger: !restore,
        confirmLabel: restore ? "Yes, restore" : "Yes, archive",
      }
    );
    if (!ok) return;
    setBulkBusy(true);
    try {
      await setTrashMany("order", ids, restore);
    } catch {
      setBulkBusy(false);
      return;
    }
    setBulkBusy(false);
    const stamp = restore ? null : new Date().toISOString();
    setRows((current) =>
      current.map((order) =>
        ids.includes(order.id) ? { ...order, trashedAt: stamp } : order
      )
    );
    selection.removeIds(ids);
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
          className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === "verified" ? "bg-cyan text-white" : "bg-white/10 text-white"}`}
          onClick={() => setFilter("verified")}
        >
          Verified profiles
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === "unverified" ? "bg-cyan text-white" : "bg-white/10 text-white"}`}
          onClick={() => setFilter("unverified")}
        >
          Unverified profiles
        </button>
        <TrashBinButton
          open={bin}
          count={rows.filter((order) => order.trashedAt).length}
          onToggle={() => {
            setBin((current) => !current);
            selection.clear();
          }}
        />
      </div>
      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search order, store, or province"
        status={status}
        onStatus={setStatus}
        statuses={ORDER_STATUSES.map((item) => ({
          value: item,
          label: orderStatusLabel(item),
        }))}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ListSelectCheckbox
          checked={selection.allVisibleSelected}
          onChange={selection.toggleAllVisible}
          label="Select all"
        />
        <BulkArchiveBar
          count={selection.selectedVisible.length}
          archivedView={bin}
          busy={bulkBusy}
          onArchive={() => onBulk(false)}
          onRestore={() => onBulk(true)}
          onClear={selection.clear}
        />
      </div>
      {visible.map((order) => {
        const statusValue =
          order.status === "confirmed" ? "accepted" : order.status;
        return (
          <article key={order.id} className="surface rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-black accent-cyan"
                  checked={selection.selected.includes(order.id)}
                  onChange={() => selection.toggle(order.id)}
                  aria-label={`Select ${order.orderNumber}`}
                />
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
              <TrashAction
                trashed={Boolean(order.trashedAt)}
                busy={busy === order.id}
                onTrash={() => onTrash(order.id)}
                onRestore={() => onTrash(order.id, true)}
              />
            </div>
          </article>
        );
      })}
      {visible.length === 0 && (
        <p className="text-sm text-slate-ink">
          {pool.length === 0
            ? bin
              ? "Archive is empty."
              : "No orders yet."
            : "Nothing matches this filter."}
        </p>
      )}
    </div>
  );
}
