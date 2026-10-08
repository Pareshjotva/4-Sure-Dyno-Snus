import { SiteShell } from "@/components/layout/site-shell";
import { ProgramRules } from "@/components/retailer/program-rules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getIncentives } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Retailer Program",
  description:
    "Dyno Snus volume discounts: 5%, 10%, and 15% tiers for licensed Canadian retailers.",
};

export default async function IncentivesPage() {
  const incentives = await getIncentives();
  const maxOff = incentives.reduce(
    (max, tier) => Math.max(max, tier.discountPercent),
    0
  );

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Badge>B2B retail program</Badge>
        <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
          Retailer Program
        </h1>
        <p className="mt-3 max-w-2xl text-slate-ink">
          Buy more, save more — calendar-month volume tiers unlock{" "}
          {maxOff ? `up to ${maxOff}%` : "volume"} off on the qualifying order.
          Ordering and live pricing stay inside the retailer panel.
        </p>

        <div className="mt-10">
          <ProgramRules tiers={incentives} />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/account">
            <Button size="lg">Sign in to order</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              Join as a retailer
            </Button>
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
