import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function AdminRetailersPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/login");
  const retailers = (await getUsers()).filter((u) => u.role === "retailer");

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Retailers</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Registered wholesale accounts for Dyno Snus ordering.
      </p>
      <div className="mt-6 space-y-3">
        {retailers.map((user) => (
          <div key={user.id} className="surface rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-navy">{user.name}</p>
                <p className="text-sm text-slate-ink">
                  {user.company} · {user.email}
                </p>
              </div>
              <Badge className={user.active ? "" : "bg-warn-red/10 text-warn-red"}>
                {user.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-navy/55">
              {user.province} · Licence {user.licenceNumber || "—"} · Joined{" "}
              {formatDate(user.createdAt)}
            </p>
          </div>
        ))}
        {retailers.length === 0 && (
          <p className="text-sm text-slate-ink">No retailers yet.</p>
        )}
      </div>
    </div>
  );
}
