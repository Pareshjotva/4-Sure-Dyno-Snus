import { AdminContactClient } from "@/components/admin/contact-client";
import { requireSession } from "@/lib/auth";
import { getSite } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const site = await getSite();

  return (
    <div>
      <h1 className="font-display text-3xl text-white">Contact details</h1>
      <p className="mt-2 text-sm text-slate-ink">
        These details appear together on the contact page, footer, home page,
        about page, privacy page, and invoices.
      </p>
      <div className="mt-6">
        <AdminContactClient
          contact={{
            phone: site.phone,
            email: site.email,
            secondaryEmail: site.secondaryEmail,
            address: site.address,
            website: site.website,
            salesContact: site.salesContact,
          }}
        />
      </div>
    </div>
  );
}
