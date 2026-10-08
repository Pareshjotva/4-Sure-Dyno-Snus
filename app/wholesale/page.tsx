import { WholesaleInquiryForm } from "@/components/forms/wholesale-inquiry-form";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wholesale",
  description:
    "Send a Dyno Snus wholesale inquiry for licensed Canadian adult retail businesses. No public prices.",
};

export default function WholesalePage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Badge>B2B wholesale inquiry</Badge>
        <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
          Wholesale
        </h1>
        <p className="mt-3 max-w-2xl text-slate-ink">
          Fill in your business details below. Our team reviews every wholesale
          inquiry in the admin panel and follows up with next steps. This page
          does not show prices.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <WholesaleInquiryForm />

          <aside className="space-y-4">
            <div className="rounded-2xl border border-cyan/30 bg-black/45 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
                Already a retailer?
              </p>
              <h2 className="mt-2 font-display text-xl text-white">
                Retailer Program
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Licensed shops that already have a retailer account use the
                Retailer Program for monthly volume incentives (5% / 10% /
                15%) and place orders in the retailer panel.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/incentives">
                  <Button variant="outline" size="sm">
                    Retailer Program
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Open retailer account</Button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
