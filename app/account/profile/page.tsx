import { requireSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await requireSession("retailer");
  if (!session) redirect("/login");
  const user = await getUserById(session.id);
  if (!user) redirect("/login");

  const fields = [
    ["Name", user.name],
    ["Email", user.email],
    ["Company", user.company || "—"],
    ["Phone", user.phone || "—"],
    ["Province", user.province || "—"],
    ["Address", user.address || "—"],
    ["Licence #", user.licenceNumber || "—"],
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Profile</h1>
      <div className="surface mt-6 grid gap-4 rounded-2xl p-5 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan">
              {label}
            </p>
            <p className="mt-1 text-navy">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
