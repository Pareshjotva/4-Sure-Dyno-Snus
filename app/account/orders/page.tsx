import { AccountOrdersList } from "@/components/account/orders-list";
import { requireSession } from "@/lib/auth";
import { getOrders, getProducts } from "@/lib/db";
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
      <AccountOrdersList orders={orders} images={images} />
    </div>
  );
}
