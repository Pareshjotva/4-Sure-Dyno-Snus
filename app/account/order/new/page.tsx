import { OrderForm } from "@/components/account/order-form";
import { requireSession } from "@/lib/auth";
import { getIncentives, getOrders, getProducts, getSite, getUserById } from "@/lib/db";
import { packsThisMonth } from "@/lib/site";
import { redirect } from "next/navigation";

export default async function NewOrderPage() {
  const session = await requireSession("retailer");
  if (!session) redirect("/login");
  const [products, site, user, incentives, orders] = await Promise.all([
    getProducts(),
    getSite(),
    getUserById(session.id),
    getIncentives(),
    getOrders(session.id),
  ]);
  if (!user) redirect("/login");

  const monthPacks = packsThisMonth(orders);

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Place an order</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Minimum {site.minOrderPacks} packs for free shipping. Each order’s
        discount uses packs already bought this month plus the packs on this
        order. 20–40 combined is 5% off, 41–60 is 10% off, and 80+ is 15% off.
      </p>

      <div className="mt-6">
        <OrderForm
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            image: p.image,
          }))}
          defaultProvince={session.province || "BC"}
          minOrderPacks={site.minOrderPacks}
          needsLicence={!user.licenceNumber?.trim()}
          tiers={incentives}
          monthPacks={monthPacks}
        />
      </div>
    </div>
  );
}
