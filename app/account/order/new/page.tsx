import { OrderForm } from "@/components/account/order-form";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import { getIncentives, getOrders, getProducts, getSite, getUserById } from "@/lib/db";
import { orderEligibility } from "@/lib/profile-status";
import {
  monthOrders,
  orderGrantedDiscount,
  packCountOf,
} from "@/lib/volume-discount";
import Link from "next/link";
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

  const priorMonth = monthOrders(orders);
  const monthPacks = priorMonth.reduce((sum, order) => sum + packCountOf(order), 0);
  const monthSubtotal = priorMonth.reduce(
    (sum, order) => sum + (Number(order.subtotal) || 0),
    0
  );
  const previouslyGranted = priorMonth.reduce(
    (sum, order) => sum + orderGrantedDiscount(order),
    0
  );
  const gate = orderEligibility(user);
  const tierHint = incentives
    .map((tier) =>
      tier.maxPacks == null
        ? `${tier.minPacks}+ → ${tier.discountPercent}%`
        : `${tier.minPacks}–${tier.maxPacks} → ${tier.discountPercent}%`
    )
    .join(", ");

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Place an order</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Minimum {site.minOrderPacks} packs for free shipping. Discount uses this
        calendar month&apos;s cumulative packs. When you unlock a higher slab,
        catch-up credit for earlier orders is applied on the new invoice — prior
        invoices stay unchanged. Slabs: {tierHint || "configured by admin"}.
      </p>

      <div className="mt-6">
        {!gate.allowed ? (
          <div className="surface rounded-2xl p-5">
            <p className="text-sm text-warn-red" role="alert">
              {gate.message}
            </p>
            <Link href="/account/profile" className="mt-4 inline-block">
              <Button>Go to profile</Button>
            </Link>
          </div>
        ) : (
          <OrderForm
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              image: p.image,
            }))}
            defaultProvince={session.province || user.province || "BC"}
            minOrderPacks={site.minOrderPacks}
            pendingNotice={gate.pending ? gate.message : ""}
            tiers={incentives}
            monthPacks={monthPacks}
            monthSubtotal={monthSubtotal}
            previouslyGranted={previouslyGranted}
          />
        )}
      </div>
    </div>
  );
}
