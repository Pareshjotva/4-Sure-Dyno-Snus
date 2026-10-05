"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Image from "next/image";

const KEY = "dyno_age_verified_v1";

export function AgeGate() {
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
            alt="4 Sure International"
            width={180}
            height={65}
            className="h-12 w-auto"
          />
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-cyan">
          Age verification
        </p>
        <h2 className="mt-3 text-center font-display text-4xl text-white">
          Are you 19 or older?
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-ink">
          Dyno Snus is intended only for licensed adult tobacco retailers and
          adult consumers of legal age. Nicotine is highly addictive. This site
          does not sell to minors.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={confirm}>
            Yes, I am 19+
          </Button>
          <Button className="flex-1" variant="outline" onClick={deny}>
            No, exit
          </Button>
        </div>
      </div>
    </div>
  );
}
