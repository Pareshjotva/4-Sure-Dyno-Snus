import { AdminLeadsClient } from "@/components/admin/leads-client";
import { requireSession } from "@/lib/auth";
import { getLeads } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const leads = await getLeads();

  return (
    <div>
      <h1 className="font-display text-3xl text-white">Leads</h1>
      <p className="mt-2 text-sm text-white/70">
        {leads.length} inquiries from the contact form.
      </p>
      <div className="mt-6">
        <AdminLeadsClient leads={leads} />
      </div>
    </div>
  );
}
