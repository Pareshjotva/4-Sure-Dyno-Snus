import { PanelNav } from "@/components/layout/panel-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { AgeGate } from "@/components/layout/age-gate";
import { requireSession } from "@/lib/auth";
import { getRequestLegalAge } from "@/lib/request-legal-age";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, legalAge] = await Promise.all([
    requireSession("admin"),
    getRequestLegalAge(),
  ]);
  if (!session) redirect("/admin/login");

  return (
    <>
      <AgeGate minimumAge={legalAge} />
      <SiteHeader user={session} wide />
      <div className="panel-shell grid w-full gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:px-8">
        <PanelNav mode="admin" userName={session.name} />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
