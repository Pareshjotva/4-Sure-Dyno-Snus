import { AdminPricingClient } from "@/components/admin/pricing-client";
import { requireSession } from "@/lib/auth";
import { getPricing, getProducts } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminPricingPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const [pricing, products] = await Promise.all([
    getPricing(),
    getProducts(false),
  ]);
  const productNames = Object.fromEntries(
    products.map((p) => [p.id, p.name])
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Provincial pricing</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Update BC, Alberta, and Ontario worksheets shown only in the signed-in
        retailer panel. The public Wholesale page does not list dollar prices.
      </p>
      <div className="mt-6">
        <AdminPricingClient pricing={pricing} productNames={productNames} />
      </div>
    </div>
  );
}
