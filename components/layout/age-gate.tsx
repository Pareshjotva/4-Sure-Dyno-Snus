"use client";

import { Button } from "@/components/ui/button";
import { FALLBACK_LEGAL_AGE } from "@/lib/canadian-legal-age";
import { useEffect, useState } from "react";
import Image from "next/image";

const KEY = "dyno_age_verified_v1";

export function AgeGate({
  minimumAge = FALLBACK_LEGAL_AGE,
}: {
  minimumAge?: number;
}) {
  const age =
    minimumAge === 18 || minimumAge === 19 || minimumAge === 21
      ? minimumAge
      : FALLBACK_LEGAL_AGE;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const ok = localStorage.getItem(KEY);
      if (!ok) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  function confirm() {
    try {
      localStorage.setItem(KEY, "yes");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  function deny() {
    window.location.href =
      "https://www.canada.ca/en/health-canada/services/smoking-tobacco/quit-smoking.html";
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade">
      <div className="surface w-full max-w-md rounded-2xl p-6 shadow-2xl sm:p-8">
        <div className="mb-4 flex justify-center">
          <Image
            src="/images/logo-4sure-white.png"
            alt="4Sure International"
            width={180}
            height={65}
            className="h-12 w-auto"
          />
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-cyan">
          Age verification
        </p>
        <h2 className="mt-3 text-center font-display text-3xl text-white sm:text-4xl">
          Are you {age} or older?
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-ink">
          Dyno Snus is intended only for licensed adult tobacco retailers and
          adult consumers of legal age. Nicotine is highly addictive. This site
          does not sell to minors.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button className="h-auto min-h-11 w-full whitespace-normal px-2 text-sm" onClick={confirm}>
            Yes, I am {age}+
          </Button>
          <Button
            className="h-auto min-h-11 w-full whitespace-normal border-2 border-white/80 px-2 text-sm text-white"
            variant="outline"
            onClick={deny}
          >
            No, exit
          </Button>
        </div>
      </div>
    </div>
  );
}
