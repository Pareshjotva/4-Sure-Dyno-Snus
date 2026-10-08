import { EmailLinks } from "@/components/layout/email-links";
import { SiteShell } from "@/components/layout/site-shell";
import { getSite } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const site = await getSite();
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl text-navy">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-ink">
          <p>
            4Sure International Inc. (“we”) collects business contact details
            you submit through this website — including name, email, phone,
            company, province, and licence information — to respond to wholesale
            inquiries and operate retailer accounts.
          </p>
          <p>
            Account credentials and order history are stored to fulfill B2B
            orders. We do not sell personal information. Access to account data
            is limited to authorized staff and system administrators.
          </p>
          <p>
            For privacy requests, email{" "}
            <EmailLinks
              primary={site.email}
              separator="dot"
              className="text-cyan"
            />{" "}
            or call {site.phone}.
          </p>
        </div>
      </article>
    </SiteShell>
  );
}
