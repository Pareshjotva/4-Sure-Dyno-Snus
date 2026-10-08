import { EmailLinks } from "@/components/layout/email-links";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { getSite } from "@/lib/db";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About",
  description:
    "4Sure International brings Dyno Snus premium slim pouches from Norway to licensed Canadian retailers.",
};

export default async function AboutPage() {
  const site = await getSite();
  const basedIn = site.address
    .replace(/\s+[A-Z]\d[A-Z]\s*\d[A-Z]\d\s*$/i, "")
    .trim();

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

        <div className="mt-10 space-y-8">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <Image
              src="/images/about-banner.png"
              alt="4Sure International — From Global to Local, with Dyno pouches for Canadian wholesale"
              width={1672}
              height={941}
              quality={90}
              sizes="(max-width: 1152px) 100vw, 1104px"
              className="h-auto w-full max-w-[1672px]"
            />
          </div>
          <div className="grid gap-8 text-slate-ink lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] lg:items-start">
            <div className="space-y-4">
              <p>
                Based in {basedIn}, {site.companyName} supplies Dyno Extreme Slim
                and Dyno Blast Slim
                to registered retailers in British Columbia, Alberta, and
                Ontario.
              </p>
              <p>
                Every pack follows Canadian plain-packaging requirements and
                carries the Health Canada health warnings required for nicotine
                products. Our role is wholesale: we help licensed shops stock a
                discreet, spit-free format adult consumers already understand.
              </p>
            </div>
            <div className="surface rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan">
                Sales contact
              </p>
              {site.salesContact ? (
                <p className="mt-2 font-display text-2xl text-navy">
                  {site.salesContact}
                </p>
              ) : null}
              <p className="mt-2 text-sm">
                {site.phone}
                <br />
                <EmailLinks
                  emails={[site.email, site.secondaryEmail]}
                  className="text-cyan"
                />
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
