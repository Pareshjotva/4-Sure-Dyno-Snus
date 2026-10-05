import { SiteShell } from "@/components/layout/site-shell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl text-navy">Terms of Use</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-ink">
          <p>
            This website is operated by 4 Sure International Inc. for licensed
            adult tobacco retailers and wholesale partners in Canada. By using
            the site you confirm you are of legal age (19+) in your province and
            will use the information lawfully.
          </p>
          <p>
            Product availability, pricing, taxes, and incentive terms may change
            without notice. Published worksheets are informational until
            confirmed on an official quote or invoice.
          </p>
          <p>
            Orders placed through retailer accounts are subject to acceptance,
            licence verification, and payment terms communicated by 4 Sure
            International.
          </p>
        </div>
      </article>
    </SiteShell>
  );
}
