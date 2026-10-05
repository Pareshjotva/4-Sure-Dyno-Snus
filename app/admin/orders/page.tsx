import { AdminOrdersClient } from "@/components/admin/orders-client";
import { requireSession } from "@/lib/auth";
import { getOrders } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminOrdersPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/login");
  const orders = await getOrders();

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Orders</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Update fulfillment status for retailer wholesale orders.
      </p>
      <div className="mt-6">
        <AdminOrdersClient orders={orders} />
      </div>
    </div>
  );
}
