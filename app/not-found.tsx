import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-cyan">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl text-navy">Page not found</h1>
        <p className="mt-3 text-slate-ink">
          That page doesn&apos;t exist or was moved.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button>Back to home</Button>
        </Link>
      </div>
    </SiteShell>
  );
}
