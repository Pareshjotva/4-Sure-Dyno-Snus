import { AdminLeadsClient } from "@/components/admin/leads-client";
import { requireSession } from "@/lib/auth";
import { getLeads } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminLeadsPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/login");
  const leads = await getLeads();

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Leads</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Inquiries from the public contact form.
      </p>
      <div className="mt-6">
        <AdminLeadsClient leads={leads} />
      </div>
    </div>
  );
}
