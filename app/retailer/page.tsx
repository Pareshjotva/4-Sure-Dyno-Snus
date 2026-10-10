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
    "Dyno Snus Retailer Incentive Program — buy more, save more with 5%, 10%, and 15% monthly volume tiers.",
};

export default async function RetailerProgramPage() {
  const incentives = await getIncentives();
  const maxOff = incentives.reduce(
    (max, tier) => Math.max(max, tier.discountPercent),
    0
  );

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Badge>Volume incentive</Badge>
        <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
          Retailer Program
        </h1>
        <p className="mt-2 font-display text-xl tracking-wide text-cyan sm:text-2xl">
          Buy more. Save more.
        </p>
        <p className="mt-3 max-w-2xl text-slate-ink">
          For licensed retailers with a retailer account. Calendar-month pack
          volume unlocks {maxOff ? `up to ${maxOff}%` : "volume"} off on the
          qualifying order. Separate wholesale inquiries use the{" "}
          <Link
            href="/wholesale"
            className="text-cyan underline-offset-2 hover:underline"
          >
            Wholesale
          </Link>{" "}
          form.
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
              Open retailer account
            </Button>
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
