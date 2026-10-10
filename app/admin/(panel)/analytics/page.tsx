import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { requireSession } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Analytics" };

export default async function AdminAnalyticsPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Analytics</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-ink">
        Traffic from public pages is tracked automatically. Country, region, and city come from
        approximate IP geolocation. The exit page is the last page observed in the session,
        not a guaranteed exit.
      </p>
      <AnalyticsDashboard />
    </div>
  );
}
