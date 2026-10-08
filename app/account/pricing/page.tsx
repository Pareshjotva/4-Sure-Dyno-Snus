import { PricingTable } from "@/components/account/pricing-table";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import { getPricing, getProducts, getSite } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Wholesale Pricing",
  description: "Dyno Snus wholesale pricing for signed-in retailers.",
};

export default async function AccountPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ province?: string }>;
}) {
  const session = await requireSession("retailer");
  if (!session) redirect("/login");

  const { province } = await searchParams;
  const code = (province || session.province || "BC").toUpperCase();
  const [pricing, products, site] = await Promise.all([
    getPricing(code),
    getProducts(),
    getSite(),
  ]);

  return (
    <div>
      <PricingTable
        code={code}
        pricing={pricing}
        products={products}
        site={site}
        basePath="/account/pricing"
      />
      <div className="mt-8">
        <Link href="/account/order/new">
          <Button size="lg">Place an order</Button>
        </Link>
      </div>
    </div>
  );
}
