import { PanelNav } from "@/components/layout/panel-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { AgeGate } from "@/components/layout/age-gate";
import { requireSession } from "@/lib/auth";
import { getRequestLegalAge } from "@/lib/request-legal-age";
import { redirect } from "next/navigation";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, legalAge] = await Promise.all([
    requireSession("retailer"),
    getRequestLegalAge(),
  ]);
  if (!session) redirect("/login");

  return (
    <>
      <AgeGate minimumAge={legalAge} />
      <SiteHeader user={session} />
      <div className="panel-shell mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr]">
        <PanelNav mode="account" userName={session.name} />
        <div>{children}</div>
      </div>
    </>
  );
}
