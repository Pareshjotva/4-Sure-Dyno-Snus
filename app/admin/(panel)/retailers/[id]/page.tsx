import { RetailerReview } from "@/components/admin/retailer-review";
import { requireSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { profileStatus, PROFILE_STATUS_LABEL } from "@/lib/profile-status";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await getUserById(id);
  return { title: user ? user.name : "Retailer" };
}

export default async function AdminRetailerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const user = await getUserById(id);
  if (!user || user.role !== "retailer") notFound();
  const status = profileStatus(user);
  const fields = [
    ["Name", user.name],
    ["Email", user.email],
    ["Phone", user.phone || "—"],
    ["Country", user.country || "—"],
    ["Company/store", user.company || "—"],
    ["Store address", user.address || "—"],
    ["City", user.city || "—"],
    ["Postal code", user.postalCode || "—"],
    ["Joined", formatDate(user.createdAt)],
    ["Status", PROFILE_STATUS_LABEL[status]],
  ];

  return (
    <div>
      <Link href="/admin/retailers" className="text-sm font-semibold text-cyan">
        ← Retailers
      </Link>
      <h1 className="mt-3 font-display text-3xl text-navy">{user.name}</h1>
      <p className="mt-2 text-sm text-slate-ink">{PROFILE_STATUS_LABEL[status]}</p>
      <div className="surface mt-6 grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan">{label}</p>
            <p className="mt-1 text-white">{value}</p>
          </div>
        ))}
      </div>
      <RetailerReview
        userId={user.id}
        status={status}
        licenses={[
          { slot: "primary", label: "Tobacco retail dealer's permit", license: user.license },
          { slot: "location2", label: "Location 2", license: user.license2 },
          { slot: "location3", label: "Location 3", license: user.license3 },
        ]}
        audit={user.profileAudit || []}
      />
    </div>
  );
}
