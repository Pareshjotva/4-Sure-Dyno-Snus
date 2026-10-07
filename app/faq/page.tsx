import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { getFaqs } from "@/lib/db";
import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";

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
        <div className="mt-8 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.id}
              className="surface group rounded-2xl px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-2xl text-white [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown
                  size={20}
                  className="shrink-0 text-cyan transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/75">
                {faq.answer}
              </p>
            </details>
          ))}
          {faqs.length === 0 && (
            <p className="text-sm text-slate-ink">No questions yet.</p>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
