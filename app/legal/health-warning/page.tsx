import { SiteShell } from "@/components/layout/site-shell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Health Warning" };

export default function HealthWarningPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl text-navy">Health warning</h1>
        <div className="mt-6 space-y-4 rounded-2xl border border-warn-red/30 bg-warn-yellow/90 p-6 text-sm leading-relaxed text-black">
          <p className="font-bold uppercase tracking-wide text-warn-red">
            Warning / Avertissement
          </p>
          <p>
            This product contains nicotine. Nicotine is a highly addictive drug.
            This product causes serious health effects, including cancer.
          </p>
          <p>
            Ce produit contient de la nicotine. La nicotine est une drogue qui
            crée une forte dépendance. Ce produit cause de graves effets sur la
            santé, y compris le cancer.
          </p>
          <p>
            Quit resources:{" "}
            <a
              className="underline"
              href="https://gosmokefree.gc.ca/quit"
              target="_blank"
              rel="noreferrer"
            >
              gosmokefree.gc.ca/quit
            </a>{" "}
            · 1-866-366-3667 ·{" "}
            <a
              className="underline"
              href="https://vivezsansfumee.gc.ca/abandon"
              target="_blank"
              rel="noreferrer"
            >
              vivezsansfumee.gc.ca/abandon
            </a>
          </p>
        </div>
      </article>
    </SiteShell>
  );
}
