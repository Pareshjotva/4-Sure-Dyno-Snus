import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { getSite } from "@/lib/db";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
  description:
    "4 Sure International brings Dyno Snus premium slim pouches from Norway to licensed Canadian retailers.",
};

export default async function AboutPage() {
  const site = await getSite();

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Badge>About us</Badge>
        <h1 className="mt-3 max-w-3xl font-display text-4xl text-navy sm:text-5xl">
          {site.companyName} — {site.tagline}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-ink">
          We connect global snus craftsmanship with local Canadian retail. Dyno
          Snus is our premium slim-pouch line for licensed adult tobacco
          partners who need reliable strength, clean packaging compliance, and
          dependable wholesale support.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-2xl bg-black p-8 border border-white/10">
            <Image
              src="/images/logo-4sure-white.png"
              alt="4 Sure International logo"
              width={420}
              height={150}
              className="h-auto w-full max-w-md object-contain"
            />
          </div>
          <div className="space-y-4 text-slate-ink">
            <p>
              Based in {site.address}, {site.companyName} supplies Dyno Extreme
              Slim and Dyno Blast White Slim to registered retailers in British
              Columbia, Alberta, and Ontario.
            </p>
            <p>
              Every pack follows Canadian plain-packaging requirements and
              carries the Health Canada health warnings required for nicotine
              products. Our role is wholesale: we help licensed shops stock a
              discreet, spit-free format adult consumers already understand.
            </p>
            <div className="surface rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan">
                Sales contact
              </p>
              <p className="mt-2 font-display text-2xl text-navy">
                {site.salesContact}
              </p>
              <p className="mt-1 text-sm">
                {site.phone}
                <br />
                {site.email}
                <br />
                {site.website}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
