"use client";

import { FilterBar, matchesQuery } from "@/components/ui/filter-bar";
import type { Faq } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function FaqList({ faqs }: { faqs: Faq[] }) {
  const [query, setQuery] = useState("");
  const visible = faqs.filter((faq) => matchesQuery(query, faq.question, faq.answer));

  return (
    <div className="mt-8 space-y-4">
      <FilterBar query={query} onQuery={setQuery} placeholder="Search questions" />
      <div className="space-y-3">
        {visible.map((faq) => (
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
        {visible.length === 0 && (
          <p className="text-sm text-slate-ink">
            {faqs.length === 0 ? "No questions yet." : "Nothing matches this filter."}
          </p>
        )}
      </div>
    </div>
  );
}
