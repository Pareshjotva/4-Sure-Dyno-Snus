"use client";

import { TrashAction, TrashBinButton, setTrash } from "@/components/admin/trash-bin";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { FilterBar, matchesQuery } from "@/components/ui/filter-bar";
import { Select } from "@/components/ui/select";
import type { ContactLead } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLeadsClient({ leads }: { leads: ContactLead[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(leads);
  const [bin, setBin] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const pool = rows.filter((lead) => (bin ? lead.trashedAt : !lead.trashedAt));
  const visible = pool.filter(
    (lead) =>
      (!status || lead.status === status) &&
      matchesQuery(
        query,
        lead.name,
        lead.email,
        lead.phone,
        lead.company,
        lead.province,
        lead.message
      )
  );

  async function updateStatus(
    id: string,
    status: ContactLead["status"]
  ) {
    const ok = await confirmAction(`Update this lead status to "${status}"?`, {
      confirmLabel: "Yes, update status",
    });
    if (!ok) return;
    setBusy(id);
    await fetch(`/api/admin/leads/${id}`, {
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
      !(await confirmAction("Move this lead to trash?", {
        danger: true,
        confirmLabel: "Yes, move to trash",
      }))
    ) {
      return;
    }
    setBusy(id);
    try {
      await setTrash("lead", id, restore);
    } catch {
      setBusy(null);
      return;
    }
    setBusy(null);
    const stamp = restore ? null : new Date().toISOString();
    setRows((current) =>
      current.map((lead) => (lead.id === id ? { ...lead, trashedAt: stamp } : lead))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <TrashBinButton
          open={bin}
          count={rows.filter((lead) => lead.trashedAt).length}
          onToggle={() => setBin((current) => !current)}
        />
      </div>
      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search name, email, or message"
        status={status}
        onStatus={setStatus}
        statuses={[
          { value: "new", label: "New" },
          { value: "contacted", label: "Contacted" },
          { value: "closed", label: "Closed" },
        ]}
      />
      {visible.map((lead) => (
        <article key={lead.id} className="surface rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white">{lead.name}</p>
              <p className="text-sm text-white/80">
                {lead.email}
                {lead.phone ? ` · ${lead.phone}` : ""}
              </p>
              <p className="text-xs text-white/60">
                {lead.company || "No company"} · {lead.province || "No province"} ·{" "}
                {formatDate(lead.createdAt)}
              </p>
            </div>
            <Select
              className="w-40"
              value={lead.status}
              disabled={busy === lead.id}
              onChange={(e) =>
                updateStatus(
                  lead.id,
                  e.target.value as ContactLead["status"]
                )
              }
            >
              <option value="new">new</option>
              <option value="contacted">contacted</option>
              <option value="closed">closed</option>
            </Select>
            <TrashAction
              trashed={Boolean(lead.trashedAt)}
              busy={busy === lead.id}
              onTrash={() => onTrash(lead.id)}
              onRestore={() => onTrash(lead.id, true)}
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/90">
            {lead.message}
          </p>
        </article>
      ))}
      {visible.length === 0 && (
        <p className="text-sm text-white/70">
          {pool.length === 0
            ? bin
              ? "Trash is empty."
              : "No contact inquiries yet."
            : "Nothing matches this filter."}
        </p>
      )}
    </div>
  );
}
