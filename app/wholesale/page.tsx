import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { WholesaleContent } from "@/components/wholesale/wholesale-content";
import { getSite } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wholesale",
  description:
    "Open a Dyno Snus provincial wholesale inquiry for licensed Canadian adult retail businesses. No public prices.",
};

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
          Ready to open a provincial wholesale account? Review the setup steps,
          then send an inquiry with your business details. Prices are shared
          privately after we follow up — not on this page.
        </p>

        <WholesaleContent minOrderPacks={site.minOrderPacks} />
      </div>
    </SiteShell>
  );
}
