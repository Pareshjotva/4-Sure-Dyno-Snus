import { OrderForm } from "@/components/account/order-form";
import { requireSession } from "@/lib/auth";
import { getProducts, getSite, getUserById } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function NewOrderPage() {
  const session = await requireSession("retailer");
  if (!session) redirect("/login");
  const [products, site, user] = await Promise.all([
    getProducts(),
    getSite(),
    getUserById(session.id),
  ]);
  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Place an order</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Minimum {site.minOrderPacks} packs for free shipping. Volume discounts
        apply automatically when you hit a monthly tier.
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
        />
      </div>
    </div>
  );
}
