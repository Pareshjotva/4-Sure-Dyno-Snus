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
    <div className="admin-shell">
      <AgeGate minimumAge={legalAge} />
      <SiteHeader user={session} theme="light" />
      <div className="panel-shell mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:px-8">
        <PanelNav mode="admin" userName={session.name} />
        <div>{children}</div>
      </div>
    </div>
  );
}
