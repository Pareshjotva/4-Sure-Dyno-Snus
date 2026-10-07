import { getSession } from "@/lib/auth";
import { getRequestLegalAge } from "@/lib/request-legal-age";
import { AgeGate } from "@/components/layout/age-gate";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [session, legalAge] = await Promise.all([
    getSession(),
    getRequestLegalAge(),
  ]);

  return (
    <>
      <AgeGate minimumAge={legalAge} />
      <SiteHeader user={session} />
      <main className="min-h-[70vh]">{children}</main>
      <SiteFooter />
    </>
  );
}
