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

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Place an order</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Minimum {site.minOrderPacks} packs for free shipping. Discount follows
        this month’s volume: 40–59 packs 5% off, 60–79 packs 10% off, 80+ packs
        15% off.
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
          monthPacks={packsThisMonth(orders)}
        />
      </div>
    </div>
  );
}
