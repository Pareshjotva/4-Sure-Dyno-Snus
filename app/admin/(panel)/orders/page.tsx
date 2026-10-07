import { AdminOrdersClient } from "@/components/admin/orders-client";
import { requireSession } from "@/lib/auth";
import { getOrders, getProducts } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminOrdersPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const [orders, products] = await Promise.all([
    getOrders(),
    getProducts(false),
  ]);
  const images = Object.fromEntries(
    products.map((product) => [product.id, product.image])
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Orders</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Update fulfillment status for retailer wholesale orders.
      </p>
      <div className="mt-6">
        <AdminOrdersClient orders={orders} images={images} />
      </div>
    </div>
  );
}
