import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSite } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wholesale",
  description:
    "Open a Dyno Snus provincial wholesale account for licensed Canadian adult retailers.",
};

const SETUP_STEPS = [
  {
    title: "Confirm your province",
    detail: "BC · Alberta · Ontario",
  },
  {
    title: "Provide retailer information",
    detail:
      "Legal business name, store/account name, business address, sales contact, phone, and email.",
  },
  {
    title: "Provide required account information",
    detail: "Provincial / federal licences and registration details.",
  },
  {
    title: "Select Dyno Snus products",
    detail: "Extreme Slim 50 g and Blast White Slim 50 g.",
  },
  {
    title: "Confirm your order",
    detail: "Case pack: 20 × 50 g packs / case.",
  },
  {
    title: "Receive wholesale account details",
    detail:
      "Current pricing, applicable taxes/PTT, shipping, payment terms, and ordering requirements — shared privately after account setup.",
  },
] as const;

export default async function WholesalePage() {
  const site = await getSite();

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Badge>B2B wholesale</Badge>
        <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
          Wholesale
        </h1>
        <p className="mt-3 max-w-2xl text-slate-ink">
          Ready to open a provincial wholesale account? Get set up with Dyno
          Snus for your licensed adult retail business. SKU sheets and dollar
          figures are shared privately after sign-up — not on this public page.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <h2 className="font-display text-2xl text-navy">Account setup</h2>
            <ol className="mt-6 space-y-4">
              {SETUP_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan/20 font-display text-sm text-cyan">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm text-white/70">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="space-y-4">
            <div className="surface rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
                After you are set up
              </p>
              <h2 className="mt-2 font-display text-2xl text-white">
                Order from the retailer panel
              </h2>
              <p className="mt-3 text-sm text-white/70">
                Signed-in retailers place orders, review provincial worksheets,
                and track monthly volume in the account panel. Public pages do
                not list wholesale dollar prices.
              </p>
              <p className="mt-4 text-sm text-white/55">
                Minimum order for free shipping: {site.minOrderPacks}× 50 g
                packs.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/register">
                  <Button size="lg" className="w-full">
                    Open wholesale account
                  </Button>
                </Link>
                <Link href="/account">
                  <Button size="lg" variant="outline" className="w-full">
                    Retailer sign in
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan/30 bg-black/45 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
                Separate program
              </p>
              <h2 className="mt-2 font-display text-xl text-white">
                Retailer Program
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Monthly volume incentives (5% / 10% / 15% off) live on the
                Retailer Program page — not on Wholesale.
              </p>
              <Link href="/incentives" className="mt-4 inline-block">
                <Button variant="outline" size="sm">
                  View Retailer Program
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
