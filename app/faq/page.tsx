import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { getFaqs } from "@/lib/db";
import type { Faq } from "@/lib/types";
import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about Dyno Extreme Slim and Dyno Blast Slim pouches from 4Sure International.",
};

function FaqItem({ faq }: { faq: Faq }) {
  return (
    <details className="surface group rounded-2xl px-5 py-4">
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
  );
}

export default async function FaqPage() {
  const faqs = await getFaqs(true);
  const splitAt = Math.ceil(faqs.length / 2);
  const left = faqs.slice(0, splitAt);
  const right = faqs.slice(splitAt);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Badge>FAQ</Badge>
        <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
          Everything you need to know
        </h1>
        {faqs.length === 0 ? (
          <p className="mt-8 text-sm text-slate-ink">No questions yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 items-start gap-3 md:grid-cols-2">
            <div className="space-y-3">
              {left.map((faq) => (
                <FaqItem key={faq.id} faq={faq} />
              ))}
            </div>
            {right.length > 0 && (
              <div className="space-y-3">
                {right.map((faq) => (
                  <FaqItem key={faq.id} faq={faq} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
