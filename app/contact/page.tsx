import { ContactForm } from "@/components/forms/contact-form";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { getSite } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact 4 Sure International about Dyno Snus wholesale accounts for licensed retailers.",
};

export default async function ContactPage() {
  const site = await getSite();

  return (
    <SiteShell>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div>
          <Badge>Contact sales</Badge>
          <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
            Let&apos;s set up your Dyno account
          </h1>
          <p className="mt-4 text-slate-ink">
            Share your retailer details and we&apos;ll follow up with current
            pricing, taxes/PTT, shipping, and ordering steps for your province.
          </p>
          <div className="mt-8 space-y-3 text-sm text-navy">
            <p>
              <span className="font-semibold">Contact:</span> {site.salesContact}
            </p>
            <p>
              <span className="font-semibold">Phone:</span>{" "}
              <a href={`tel:${site.phone}`} className="text-cyan">
                {site.phone}
              </a>
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              <a href={`mailto:${site.email}`} className="text-cyan">
                {site.email}
              </a>
            </p>
            <p>
              <span className="font-semibold">Office:</span> {site.address}
            </p>
          </div>
        </div>
        <ContactForm />
      </div>
    </SiteShell>
  );
}
