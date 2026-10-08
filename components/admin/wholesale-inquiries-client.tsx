"use client";

import { Select } from "@/components/ui/select";
import type { WholesaleInquiry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminWholesaleInquiriesClient({
  inquiries,
}: {
  inquiries: WholesaleInquiry[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function updateStatus(
    id: string,
    status: WholesaleInquiry["status"]
  ) {
    setBusy(id);
    await fetch(`/api/admin/wholesale-inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {inquiries.map((row) => (
        <article key={row.id} className="surface rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white">{row.name}</p>
              <p className="text-sm text-white/80">
                {row.email}
                {row.phone ? ` · ${row.phone}` : ""}
              </p>
              <p className="text-xs text-white/60">
                {row.company} · {row.province}
                {row.licenceNumber ? ` · Licence ${row.licenceNumber}` : ""}
                {row.address ? ` · ${row.address}` : ""} ·{" "}
                {formatDate(row.createdAt)}
              </p>
            </div>
            <Select
              className="w-40"
              value={row.status}
              disabled={busy === row.id}
              onChange={(e) =>
                updateStatus(
                  row.id,
                  e.target.value as WholesaleInquiry["status"]
                )
              }
            >
              <option value="new">new</option>
              <option value="contacted">contacted</option>
              <option value="closed">closed</option>
            </Select>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/90">
            {row.message}
          </p>
        </article>
      ))}
      {inquiries.length === 0 && (
        <p className="text-sm text-white/70">No wholesale inquiries yet.</p>
      )}
    </div>
  );
}
