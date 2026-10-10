import { AdminRetailersClient } from "@/components/admin/retailers-client";
import { requireSession } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { profileStatus } from "@/lib/profile-status";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminRetailersPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const retailers = (await getUsers())
    .filter((user) => user.role === "retailer")
    .map((user) => ({
      id: user.id,
      name: user.name,
      company: user.company || "",
      email: user.email,
      phone: user.phone || "",
      joined: formatDate(user.createdAt),
      status: profileStatus(user),
    }));

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Retailers</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Review profile details, licenses, and verification status.
      </p>
      <AdminRetailersClient retailers={retailers} />
    </div>
  );
}
