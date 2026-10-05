import { PanelNav } from "@/components/layout/panel-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { AgeGate } from "@/components/layout/age-gate";
import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession("retailer");
  if (!session) redirect("/login");

  return (
    <>
      <AgeGate />
      <SiteHeader user={session} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr]">
        <PanelNav mode="account" userName={session.name} />
        <div>{children}</div>
      </div>
    </>
  );
}
