import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSite } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wholesale Pricing",
  description:
    "Dyno Snus B2B pricing for licensed Canadian retailers — available in the retailer panel.",
};

export default async function PricingPage() {
  const site = await getSite();

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Badge>B2B partners only</Badge>
        <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
          Wholesale pricing
        </h1>
        <p className="mt-3 max-w-2xl text-slate-ink">
          Live SKU sheets, provincial PTT, and case planning figures are shown
          only inside the signed-in retailer panel — not on the public site.
        </p>

        <div className="surface mt-8 max-w-2xl rounded-2xl p-6">
          <h2 className="font-display text-2xl text-white">
            How to view pricing
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white/80">
            <li>Sign in to your wholesale retailer account.</li>
            <li>Open Pricing in the retailer panel.</li>
            <li>Place orders from Place order — not from public CTAs.</li>
          </ol>
          <p className="mt-4 text-sm text-white/65">
            Minimum order for free shipping: {site.minOrderPacks}× 50 g packs.
            New shops can open an account first, then access pricing after sign
            in.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/account">
              <Button size="lg">Open retailer panel</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                Open wholesale account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
