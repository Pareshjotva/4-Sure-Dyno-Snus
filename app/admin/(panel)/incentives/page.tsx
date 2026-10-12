import { AdminIncentivesClient } from "@/components/admin/incentives-client";
import { requireSession } from "@/lib/auth";
import { getIncentives } from "@/lib/db";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Discount slabs" };

export default async function AdminIncentivesPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const tiers = await getIncentives();

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Volume discount slabs</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Configure monthly cumulative pack thresholds and percentages used when
        retailers place orders.
      </p>
      <div className="mt-6">
        <AdminIncentivesClient tiers={tiers} />
      </div>
    </div>
  );
}
