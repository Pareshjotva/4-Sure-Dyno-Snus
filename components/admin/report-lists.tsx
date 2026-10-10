"use client";

import { FilterBar, matchesQuery } from "@/components/ui/filter-bar";
import { ORDER_STATUSES, orderStatusLabel } from "@/lib/orders";
import type { CustomerBreakdown, ReportOrderLine } from "@/lib/sales-report";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";

export function ReportLists({
  customers,
  orders,
}: {
  customers: CustomerBreakdown[];
  orders: ReportOrderLine[];
}) {
  const [customerQuery, setCustomerQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [status, setStatus] = useState("");
  const visibleCustomers = customers.filter((row) =>
    matchesQuery(customerQuery, row.customer, row.company)
  );
  const visibleOrders = orders.filter((order) => {
    const current = order.status === "confirmed" ? "accepted" : order.status;
    if (status && current !== status) return false;
    return matchesQuery(
      orderQuery,
      order.orderNumber,
      order.customer,
      order.company,
      order.summary,
      order.status
    );
  });

  return (
    <>
      {customers.length > 0 && (
        <section className="mt-8">
          <h3 className="font-display text-2xl text-white">By customer</h3>
          <p className="mt-1 text-xs text-white/50">
            Overall customer report for this period. Money totals leave out cancelled orders.
          </p>
          <div className="mt-3">
            <FilterBar
              query={customerQuery}
              onQuery={setCustomerQuery}
              placeholder="Search customer or company"
            />
          </div>
          {visibleCustomers.length === 0 ? (
            <p className="mt-3 text-sm text-white/70">Nothing matches this filter.</p>
          ) : (
            <div className="mt-3 overflow-x-auto surface rounded-2xl">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/50 text-white/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Company</th>
                    <th className="px-4 py-3 font-semibold">Orders</th>
                    <th className="px-4 py-3 font-semibold">Packs</th>
                    <th className="px-4 py-3 font-semibold">Subtotal</th>
                    <th className="px-4 py-3 font-semibold">Discount</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCustomers.map((row) => (
                    <tr key={row.key} className="border-t border-white/8">
                      <td className="px-4 py-3 font-medium text-white">{row.customer}</td>
                      <td className="px-4 py-3 text-white/75">{row.company}</td>
                      <td className="px-4 py-3 text-white/75">{row.orders}</td>
                      <td className="px-4 py-3 text-white/75">{row.packs}</td>
                      <td className="px-4 py-3 text-white">{formatCurrency(row.subtotal)}</td>
                      <td className="px-4 py-3 text-white/75">
                        {formatCurrency(row.discountAmount)}
                      </td>
                      <td className="px-4 py-3 text-white">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {orders.length > 0 && (
        <section className="mt-8">
          <h3 className="font-display text-2xl text-white">Orders</h3>
          <p className="mt-1 text-xs text-white/50">
            Every order in this report, including cancelled orders.
          </p>
          <div className="mt-3">
            <FilterBar
              query={orderQuery}
              onQuery={setOrderQuery}
              placeholder="Search order, customer, or items"
              status={status}
              onStatus={setStatus}
              statuses={ORDER_STATUSES.map((item) => ({
                value: item,
                label: orderStatusLabel(item),
              }))}
            />
          </div>
          {visibleOrders.length === 0 ? (
            <p className="mt-3 text-sm text-white/70">Nothing matches this filter.</p>
          ) : (
            <div className="mt-3 overflow-x-auto surface rounded-2xl">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/50 text-white/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Company</th>
                    <th className="px-4 py-3 font-semibold">Items</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Discount</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr key={order.id} className="border-t border-white/8">
                      <td className="px-4 py-3 text-white/75">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 font-medium text-white">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-white">{order.customer}</td>
                      <td className="px-4 py-3 text-white/75">{order.company}</td>
                      <td className="px-4 py-3 text-white/75">{order.summary}</td>
                      <td className="px-4 py-3 capitalize text-white/75">
                        {orderStatusLabel(order.status)}
                      </td>
                      <td className="px-4 py-3 text-white/75">
                        {order.discountPercent > 0
                          ? `${order.discountTier ? `${order.discountTier} ` : ""}${order.discountPercent}% (−${formatCurrency(order.discountAmount)})`
                          : formatCurrency(0)}
                      </td>
                      <td className="px-4 py-3 text-white">{formatCurrency(order.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
