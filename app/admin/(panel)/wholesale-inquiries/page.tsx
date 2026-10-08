import { AdminWholesaleInquiriesClient } from "@/components/admin/wholesale-inquiries-client";
import { requireSession } from "@/lib/auth";
import { getWholesaleInquiries } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminWholesaleInquiriesPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const inquiries = await getWholesaleInquiries();

  return (
    <div>
      <h1 className="font-display text-3xl text-white">Wholesale Inquiry</h1>
      <p className="mt-2 text-sm text-white/70">
        {inquiries.length} inquiries from the public Wholesale form.
      </p>
      <div className="mt-6">
        <AdminWholesaleInquiriesClient inquiries={inquiries} />
      </div>
    </div>
  );
}
