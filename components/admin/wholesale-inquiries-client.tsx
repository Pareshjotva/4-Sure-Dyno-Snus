"use client";

import { TrashAction, TrashBinButton, setTrash } from "@/components/admin/trash-bin";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { FilterBar, matchesQuery } from "@/components/ui/filter-bar";
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
  const [rows, setRows] = useState(inquiries);
  const [bin, setBin] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const pool = rows.filter((row) => (bin ? row.trashedAt : !row.trashedAt));
  const visible = pool.filter(
    (row) =>
      (!status || row.status === status) &&
      matchesQuery(
        query,
        row.name,
        row.email,
        row.phone,
        row.company,
        row.province,
        row.licenceNumber,
        row.message
      )
  );

  async function updateStatus(
    id: string,
    status: WholesaleInquiry["status"]
  ) {
    const ok = await confirmAction(
      `Update this inquiry status to "${status}"?`,
      { confirmLabel: "Yes, update status" }
    );
    if (!ok) return;
    setBusy(id);
    await fetch(`/api/admin/wholesale-inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  async function onTrash(id: string, restore = false) {
    if (
      !restore &&
      !(await confirmAction("Move this inquiry to trash?", {
        danger: true,
        confirmLabel: "Yes, move to trash",
      }))
    ) {
      return;
    }
    setBusy(id);
    try {
      await setTrash("wholesale", id, restore);
    } catch {
      setBusy(null);
      return;
    }
    setBusy(null);
    const stamp = restore ? null : new Date().toISOString();
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, trashedAt: stamp } : row))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <TrashBinButton
          open={bin}
          count={rows.filter((row) => row.trashedAt).length}
          onToggle={() => setBin((current) => !current)}
        />
      </div>
      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search company, name, or message"
        status={status}
        onStatus={setStatus}
        statuses={[
          { value: "new", label: "New" },
          { value: "contacted", label: "Contacted" },
          { value: "closed", label: "Closed" },
        ]}
      />
      {visible.map((row) => (
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
            <TrashAction
              trashed={Boolean(row.trashedAt)}
              busy={busy === row.id}
              onTrash={() => onTrash(row.id)}
              onRestore={() => onTrash(row.id, true)}
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/90">
            {row.message}
          </p>
        </article>
      ))}
      {visible.length === 0 && (
        <p className="text-sm text-white/70">
          {pool.length === 0
            ? bin
              ? "Trash is empty."
              : "No wholesale inquiries yet."
            : "Nothing matches this filter."}
        </p>
      )}
    </div>
  );
}
