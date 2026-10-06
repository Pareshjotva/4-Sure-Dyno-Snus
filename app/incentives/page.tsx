import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getIncentives } from "@/lib/db";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Retailer Incentive Program",
  description:
    "Dyno Snus buy-more-save-more volume discounts for licensed Canadian retailers.",
};

export default async function IncentivesPage() {
  const incentives = await getIncentives();

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

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {incentives.map((tier, i) => (
            <div
              key={tier.id}
              className={`rounded-2xl p-6 ${
                i === 2
                  ? "bg-cyan text-white"
                  : "surface text-navy"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                  i === 2 ? "text-cyan-soft" : "text-cyan"
                }`}
              >
                Tier {i + 1} · {tier.name}
              </p>
              <p className="mt-4 font-display text-5xl">
                {tier.discountPercent}%
              </p>
              <p className={`mt-2 text-sm ${i === 2 ? "text-white/75" : "text-slate-ink"}`}>
                {tier.minPacks}
                {tier.maxPacks ? `–${tier.maxPacks}` : "+"} packs (50 g) per
                calendar month
              </p>
              <p className={`mt-4 text-sm font-semibold ${i === 2 ? "text-cyan-soft" : "text-navy"}`}>
                Save ${tier.savePerPack.toFixed(2)} / 50 g pack
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-center">
          <Image
            src="/images/incentive-program.jpg"
            alt="Dyno Snus retailer incentive tiers"
            width={1200}
            height={675}
            className="h-auto w-full rounded-2xl"
          />
          <div>
            <h2 className="font-display text-3xl text-navy">How it works</h2>
            <ol className="mt-5 space-y-4 text-sm text-slate-ink">
              <li className="surface rounded-xl p-4">
                <strong className="text-navy">1. Place qualifying orders</strong>
                <p className="mt-1">
                  Order Dyno Snus during the calendar month as a registered
                  retailer.
                </p>
              </li>
              <li className="surface rounded-xl p-4">
                <strong className="text-navy">2. Hit your tier threshold</strong>
                <p className="mt-1">
                  Accumulate packs across multiple orders, or qualify in a
                  single purchase.
                </p>
              </li>
              <li className="surface rounded-xl p-4">
                <strong className="text-navy">3. Receive the discount</strong>
                <p className="mt-1">
                  Single-order qualifiers may see the discount on the invoice.
                  Multi-order volume may credit as a month-end rebate.
                </p>
              </li>
            </ol>
            <p className="mt-4 text-xs text-navy/55">
              Calendar-month qualification resets each month. Volume does not
              carry forward.
            </p>
            <Link href="/register" className="mt-6 inline-block">
              <Button>Join as a retailer</Button>
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
