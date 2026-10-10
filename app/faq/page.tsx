import { FaqList } from "@/components/faq/faq-list";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { getFaqs } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about Dyno Extreme Slim and Dyno Blast Slim pouches from 4Sure International.",
};

export default async function FaqPage() {
  const faqs = await getFaqs(true);

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Badge>FAQ</Badge>
        <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
          Everything you need to know
        </h1>
        <FaqList faqs={faqs} />
      </div>
    </SiteShell>
  );
}
