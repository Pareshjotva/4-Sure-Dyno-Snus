import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getIncentives } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Retailer Incentive Program",
  description:
    "Dyno Snus buy-more-save-more volume discounts for licensed Canadian retailers.",
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
          Buy more. Save more.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-ink">
          Reach a calendar-month volume threshold and unlock per-pack discounts
          on Dyno Snus. Qualify in one order or accumulate across the month.
        </p>

        <div className="mt-10 rounded-2xl border border-cyan/30 bg-black/50 px-6 py-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">
            Volume discount
          </p>
          <p className="mt-3 font-display text-6xl leading-none text-white sm:text-7xl">
            Up to {maxOff}% off
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/70">
            On qualifying monthly orders.
          </p>
        </div>

        <div className="mt-12 max-w-3xl">
          <h2 className="font-display text-3xl text-white">How it works</h2>
          <ol className="mt-5 space-y-4 text-sm text-white/80">
            <li className="surface rounded-xl p-4">
              <strong className="font-display text-xl text-white">
                1. Place qualifying orders
              </strong>
              <p className="mt-1 text-white/80">
                Order Dyno Snus during the calendar month as a registered
                retailer.
              </p>
            </li>
            <li className="surface rounded-xl p-4">
              <strong className="font-display text-xl text-white">
                2. Hit your tier threshold
              </strong>
              <p className="mt-1 text-white/80">
                Accumulate packs across multiple orders, or qualify in a
                single purchase.
              </p>
            </li>
            <li className="surface rounded-xl p-4">
              <strong className="font-display text-xl text-white">
                3. Receive the discount
              </strong>
              <p className="mt-1 text-white/80">
                Single-order qualifiers may see the discount on the invoice.
                Multi-order volume may credit as a month-end rebate.
              </p>
            </li>
          </ol>
          <p className="mt-4 text-xs text-white/70">
            Calendar-month qualification resets each month. Volume does not
            carry forward.
          </p>
          <Link href="/register" className="mt-6 inline-block">
            <Button>Join as a retailer</Button>
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
