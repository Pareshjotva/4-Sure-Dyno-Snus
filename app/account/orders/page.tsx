import { OrderTotals } from "@/components/orders/order-totals";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth";
import { getOrders } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AccountOrdersPage() {
  const session = await requireSession("retailer");
  if (!session) redirect("/login");
  const orders = await getOrders(session.id);

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Your orders</h1>
      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="surface rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">{order.orderNumber}</p>
                <p className="text-xs text-navy/60">
                  {formatDate(order.createdAt)} · {order.province}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/account/orders/${order.id}/invoice`}
                  className="text-sm font-semibold text-cyan"
                >
                  Invoice
                </Link>
                <Badge>{order.status}</Badge>
              </div>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-slate-ink">
              {order.items.map((item) => (
                <li key={`${order.id}-${item.productId}`}>
                  {item.productName} × {item.quantity} —{" "}
                  {formatCurrency(item.unitPrice * item.quantity)}
                </li>
              ))}
            </ul>
            <OrderTotals order={order} />
            {order.notes && (
              <p className="mt-2 text-xs text-navy/55">{order.notes}</p>
            )}
          </article>
        ))}
        {orders.length === 0 && (
          <p className="text-sm text-slate-ink">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
