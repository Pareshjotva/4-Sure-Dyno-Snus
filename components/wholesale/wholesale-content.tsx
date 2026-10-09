"use client";

import { WholesaleInquiryForm } from "@/components/forms/wholesale-inquiry-form";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useState } from "react";

const SETUP_STEPS = [
  {
    title: "Confirm your province",
    detail: "BC · Alberta · Ontario",
  },
  {
    title: "Provide retailer information",
    detail:
      "Legal business name, store/account name, business address, sales contact, phone, and email.",
  },
  {
    title: "Provide required account information",
    detail: "Provincial / federal licences and registration details.",
  },
  {
    title: "Select Dyno Snus products",
    detail: "Extreme Slim 50 g and Blast White Slim 50 g.",
  },
  {
    title: "Confirm your order",
    detail: "Case pack: 20 × 50 g packs / case.",
  },
  {
    title: "Receive wholesale account details",
    detail:
      "Current pricing, applicable taxes/PTT, shipping, payment terms, and ordering requirements — shared privately after we review your inquiry.",
  },
] as const;

export function WholesaleContent({ minOrderPacks }: { minOrderPacks: number }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section>
          <h2 className="font-display text-2xl text-navy">Account setup</h2>
          <p className="mt-2 text-sm text-slate-ink">
            Minimum order for free shipping: {minOrderPacks}× 50 g packs. Public
            pages do not list dollar prices.
          </p>
          <ol className="mt-6 space-y-4">
            {SETUP_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-black/40 p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan/20 font-display text-sm text-cyan">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="lg:sticky lg:top-24">
          <div className="surface overflow-hidden rounded-2xl">
            <Image
              src="/images/wholesale-banner.png"
              alt="Dyno Snus wholesale program"
              width={1082}
              height={874}
              quality={90}
              sizes="(max-width:1024px) 100vw, 480px"
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </aside>
      </div>

      <div className="surface mt-10 flex flex-col gap-5 rounded-2xl p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
            Ready to start?
          </p>
          <h2 className="mt-2 font-display text-2xl text-white sm:text-3xl">
            Send a wholesale inquiry
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Share your store details in the form. Our team reviews every inquiry
            in the admin panel and follows up.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full shrink-0 sm:w-auto sm:min-w-[240px] lg:self-center"
          onClick={() => setOpen(true)}
        >
          Wholesale inquiry now
        </Button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm animate-fade sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="surface max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl p-5 shadow-2xl sm:rounded-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
                  Wholesale inquiry
                </p>
                <h2
                  id={titleId}
                  className="mt-1 font-display text-2xl text-white"
                >
                  Your business details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close inquiry form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <WholesaleInquiryForm
              embedded
              onSuccess={() => {
                window.setTimeout(() => setOpen(false), 1200);
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
