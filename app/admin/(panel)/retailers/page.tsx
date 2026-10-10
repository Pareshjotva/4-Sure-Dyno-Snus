import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { profileStatus, PROFILE_STATUS_LABEL } from "@/lib/profile-status";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminRetailersPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const retailers = (await getUsers()).filter((u) => u.role === "retailer");

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Retailers</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Review profile details, licenses, and verification status.
      </p>
      <div className="mt-6 space-y-3">
        {retailers.map((user) => {
          const status = profileStatus(user);
          return (
            <div key={user.id} className="surface rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy">{user.name}</p>
                  <p className="text-sm text-slate-ink">
                    {user.company || "No store name yet"} · {user.email}
                  </p>
                </div>
                <Badge
                  className={
                    status === "verified"
                      ? ""
                      : status === "rejected" || status === "expired"
                        ? "bg-warn-red/15 text-warn-red"
                        : "bg-warn-yellow/15 text-warn-yellow"
                  }
                >
                  {PROFILE_STATUS_LABEL[status]}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-navy/55">
                {user.phone || "No phone"} · Joined {formatDate(user.createdAt)}
              </p>
              <Link
                href={`/admin/retailers/${user.id}`}
                className="mt-2 inline-block text-sm font-semibold text-cyan"
              >
                Review profile
              </Link>
            </div>
          );
        })}
        {retailers.length === 0 && (
          <p className="text-sm text-slate-ink">No retailers yet.</p>
        )}
      </div>
    </div>
  );
}
