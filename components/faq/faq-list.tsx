import type { Faq } from "@/lib/types";
import { ChevronDown } from "lucide-react";

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="mt-8">
      <div className="grid items-start gap-3 lg:grid-cols-2">
        {faqs.map((faq) => (
          <details key={faq.id} className="surface group rounded-2xl px-5 py-4">
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
          <p className="text-sm text-slate-ink lg:col-span-2">No questions yet.</p>
        )}
      </div>
    </div>
  );
}
