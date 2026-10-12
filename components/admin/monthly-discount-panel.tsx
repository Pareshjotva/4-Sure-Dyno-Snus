import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@/lib/types";
import {
  monthlyDiscountSummary,
  orderGrantedDiscount,
  packCountOf,
  resolveIncentive,
} from "@/lib/volume-discount";
import type { IncentiveTier } from "@/lib/types";
import Link from "next/link";

export function MonthlyDiscountPanel({
  orders,
  tiers,
  hrefPrefix = "/admin/orders",
}: {
  orders: Order[];
  tiers: IncentiveTier[];
  hrefPrefix?: string;
}) {
  const summary = monthlyDiscountSummary(orders);
  const tier = resolveIncentive(summary.packs, tiers);

  return (
    <div className="surface mt-6 rounded-2xl p-5">
      <h2 className="font-display text-2xl text-white">
        This month&apos;s volume discount
      </h2>
      <p className="mt-2 text-sm text-white/70">
        Calendar-month cumulative quantity. Catch-up adjustments appear on later
        orders; earlier invoices are not changed.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Monthly packs" value={String(summary.packs)} />
        <Stat
          label="Eligible purchase amount"
          value={formatCurrency(summary.eligibleAmount)}
        />
        <Stat
          label="Current slab"
          value={
            tier
              ? `${tier.name} · ${tier.discountPercent}%`
              : "0% (below first slab)"
          }
        />
        <Stat
          label="Granted this month"
          value={formatCurrency(summary.granted)}
        />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="py-2 pr-3">Order</th>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Packs</th>
              <th className="py-2 pr-3">Subtotal</th>
              <th className="py-2 pr-3">This-order %</th>
              <th className="py-2 pr-3">Adjustment</th>
              <th className="py-2 pr-3">Total credit</th>
              <th className="py-2">Payable</th>
            </tr>
          </thead>
          <tbody>
            {summary.orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-3 text-white/60">
                  No orders this calendar month.
                </td>
              </tr>
            ) : (
              summary.orders.map((order) => (
                <tr key={order.id} className="border-t border-white/10">
                  <td className="py-2 pr-3">
                    <Link
                      href={`${hrefPrefix}/${order.id}`}
                      className="font-semibold text-cyan"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-white/75">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-2 pr-3">{packCountOf(order)}</td>
                  <td className="py-2 pr-3">
                    {formatCurrency(order.subtotal)}
                  </td>
                  <td className="py-2 pr-3">
                    {order.discountPercent}% (−
                    {formatCurrency(order.discountAmount)})
                  </td>
                  <td className="py-2 pr-3">
                    −{formatCurrency(order.discountAdjustment || 0)}
                  </td>
                  <td className="py-2 pr-3 font-semibold text-cyan">
                    −{formatCurrency(orderGrantedDiscount(order))}
                  </td>
                  <td className="py-2 font-semibold">
                    {formatCurrency(order.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
        {label}
      </p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
