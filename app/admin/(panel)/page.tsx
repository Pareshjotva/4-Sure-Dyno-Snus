import { OrderTotals } from "@/components/orders/order-totals";
import { requireSession } from "@/lib/auth";
import { getDashboardStats, getLeads, getOrders } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const [stats, orders, leads] = await Promise.all([
    getDashboardStats(),
    getOrders(),
    getLeads(),
  ]);

  const cards = [
    { label: "Active products", value: stats.products },
    { label: "Retailers", value: stats.retailers },
    { label: "Orders", value: stats.orders },
    { label: "Pending orders", value: stats.pendingOrders },
    { label: "New leads", value: stats.leads },
    { label: "Revenue", value: formatCurrency(stats.revenue) },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Admin overview</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Manage Dyno Snus catalogue, wholesale pricing, retailer orders, and
        inbound leads.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="surface rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-cyan">
              {card.label}
            </p>
            <p className="mt-1 font-display text-3xl text-navy">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl text-navy">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm text-cyan">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 4).map((order) => (
              <div key={order.id} className="surface rounded-xl p-4 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-semibold text-navy">{order.orderNumber}</p>
                  <span className="rounded-md bg-mist px-2 py-0.5 text-xs uppercase">
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-navy/60">
                  {order.company || order.userName} · {formatDate(order.createdAt)}
                </p>
                <Link
                  href={`/admin/orders/${order.id}/invoice`}
                  className="text-xs font-semibold text-cyan"
                >
                  Invoice
                </Link>
                <OrderTotals order={order} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl text-navy">New leads</h2>
            <Link href="/admin/leads" className="text-sm text-cyan">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {leads.slice(0, 4).map((lead) => (
              <div key={lead.id} className="surface rounded-xl p-4 text-sm">
                <p className="font-semibold text-navy">{lead.name}</p>
                <p className="text-slate-ink">
                  {lead.email}
                  {lead.phone ? ` · ${lead.phone}` : ""} · {lead.status}
                </p>
                <p className="mt-2 text-navy/70">{lead.message}</p>
              </div>
            ))}
            {leads.length === 0 && (
              <p className="text-sm text-slate-ink">No contact inquiries yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
