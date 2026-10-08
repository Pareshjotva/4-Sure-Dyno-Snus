import { OrderItemList } from "@/components/orders/order-item-list";
import { OrderTotals } from "@/components/orders/order-totals";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth";
import { getOrders, getProducts } from "@/lib/db";
import { isInvoiceAvailable, orderStatusLabel } from "@/lib/orders";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AccountOrdersPage() {
  const session = await requireSession("retailer");
  if (!session) redirect("/login");
  const [orders, products] = await Promise.all([
    getOrders(session.id),
    getProducts(false),
  ]);
  const images = Object.fromEntries(
    products.map((product) => [product.id, product.image])
  );

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
                {isInvoiceAvailable(order.status) ? (
                  <Link
                    href={`/account/orders/${order.id}/invoice`}
                    className="text-sm font-semibold text-cyan"
                  >
                    Invoice
                  </Link>
                ) : (
                  <span className="text-xs text-white/45">
                    Invoice after acceptance
                  </span>
                )}
                <Badge>{orderStatusLabel(order.status)}</Badge>
              </div>
            </div>
            <OrderItemList
              orderId={order.id}
              items={order.items}
              images={images}
            />
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
