import { ProfileProgress } from "@/components/account/profile-progress";
import { OrderTotals } from "@/components/orders/order-totals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import { getOrders, getSite, getUserById } from "@/lib/db";
import { isInvoiceAvailable, orderStatusLabel } from "@/lib/orders";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AccountHomePage() {
  const session = await requireSession("retailer");
  if (!session) redirect("/login");
  const [orders, site, user] = await Promise.all([
    getOrders(session.id),
    getSite(),
    getUserById(session.id),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Welcome, {session.name}</h1>
      <p className="mt-2 text-sm text-slate-ink">
        {session.company || "Retailer account"} · Province{" "}
        {session.province || "—"}
      </p>
      <ProfileProgress complete={Boolean(user?.licenceNumber?.trim())} />
      {!user?.licenceNumber?.trim() && (
        <p className="mt-3 text-sm text-white/75">
          <Link href="/account/profile" className="font-semibold text-cyan">
            Open your profile
          </Link>{" "}
          to add the licence, or enter it when you place an order.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="surface rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-cyan">Orders</p>
          <p className="mt-1 font-display text-3xl text-navy">{orders.length}</p>
        </div>
        <div className="surface rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-cyan">
            Min free ship
          </p>
          <p className="mt-1 font-display text-3xl text-navy">
            {site.minOrderPacks}
          </p>
        </div>
        <div className="surface rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-cyan">Wholesale</p>
          <p className="mt-1 font-display text-3xl text-navy">$40</p>
          <p className="text-xs text-navy/55">per 50 g pack before tax</p>
        </div>
      </div>

      <div className="mt-6 flex items-stretch gap-2 sm:gap-3">
        <Link href="/account/order/new" className="flex min-w-0 flex-1 sm:flex-none">
          <Button className="h-auto min-h-11 w-full whitespace-normal px-3 py-2.5 text-center text-sm sm:w-auto">
            Place new order
          </Button>
        </Link>
        <Link href="/account/pricing" className="flex min-w-0 flex-1 sm:flex-none">
          <Button
            variant="outline"
            className="h-auto min-h-11 w-full whitespace-normal px-3 py-2.5 text-center text-sm sm:w-auto"
          >
            View pricing
          </Button>
        </Link>
        <Link href="/account/program" className="flex min-w-0 flex-1 sm:flex-none">
          <Button
            variant="outline"
            className="h-auto min-h-11 w-full whitespace-normal px-3 py-2.5 text-center text-sm sm:w-auto"
          >
            Retailer Program
          </Button>
        </Link>
      </div>

      <h2 className="mt-10 font-display text-2xl text-navy">Recent orders</h2>
      <div className="mt-4 space-y-3">
        {orders.slice(0, 5).map((order) => (
          <div
            key={order.id}
            className="surface flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
          >
            <div>
              <p className="font-semibold text-navy">{order.orderNumber}</p>
              <p className="text-xs text-navy/60">{formatDate(order.createdAt)}</p>
              {isInvoiceAvailable(order.status) ? (
                <Link
                  href={`/account/orders/${order.id}/invoice`}
                  className="text-xs font-semibold text-cyan"
                >
                  Invoice
                </Link>
              ) : (
                <p className="text-xs text-white/45">Invoice after acceptance</p>
              )}
            </div>
            <Badge>{orderStatusLabel(order.status)}</Badge>
            <OrderTotals order={order} />
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-sm text-slate-ink">No orders yet.</p>
        )}
      </div>
    </div>
  );
}
