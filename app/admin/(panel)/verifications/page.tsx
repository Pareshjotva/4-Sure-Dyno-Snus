import { AdminVerificationsClient } from "@/components/admin/verifications-client";
import { requireSession } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { profileStatus } from "@/lib/profile-status";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Verify licenses" };

const LABELS = [
  { slot: "primary", label: "Tobacco retail dealer's permit", key: "license" as const },
  { slot: "location2", label: "License for location 2", key: "license2" as const },
  { slot: "location3", label: "License for location 3", key: "license3" as const },
];

export default async function AdminVerificationsPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");

  const rows = (await getUsers())
    .filter((user) => user.role === "retailer" && !user.trashedAt)
    .map((user) => {
      const status = profileStatus(user);
      const documents = LABELS.flatMap(({ slot, label, key }) => {
        const license = user[key];
        if (!license?.storedName) return [];
        return [
          {
            slot,
            label,
            fileName: license.fileName,
            expiryDate: license.expiryDate,
            review: license.review,
            uploadedAt: license.uploadedAt,
          },
        ];
      });
      return { user, status, documents };
    })
    .filter(
      ({ status, documents }) =>
        documents.length > 0 &&
        (status === "pending" ||
          documents.some((doc) => doc.review === "pending"))
    )
    .map(({ user, status, documents }) => {
      const latest = documents
        .map((doc) => doc.uploadedAt)
        .filter(Boolean)
        .sort()
        .at(-1);
      return {
        id: user.id,
        name: user.name,
        company: user.company || "",
        email: user.email,
        status,
        uploadedAt: latest ? formatDate(latest) : "—",
        documents: documents.map(({ uploadedAt: _u, ...doc }) => doc),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Verify licenses</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Retailers who uploaded tobacco license documents for admin verification.
        View or download each file, then open the review page to approve or
        reject.
      </p>
      <AdminVerificationsClient rows={rows} />
    </div>
  );
}
