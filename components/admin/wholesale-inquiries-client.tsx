"use client";

import {
  BulkArchiveBar,
  ListSelectCheckbox,
  TrashAction,
  TrashBinButton,
  setTrash,
  setTrashMany,
  useListSelection,
} from "@/components/admin/trash-bin";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { FilterBar, matchesQuery } from "@/components/ui/filter-bar";
import { Select } from "@/components/ui/select";
import type { WholesaleInquiry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function AdminWholesaleInquiriesClient({
  inquiries,
}: {
  inquiries: WholesaleInquiry[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(inquiries);
  const [bin, setBin] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
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
  const visibleIds = useMemo(() => visible.map((row) => row.id), [visible]);
  const selection = useListSelection(visibleIds);

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
      !(await confirmAction("Archive this inquiry?", {
        danger: true,
        confirmLabel: "Yes, archive",
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
    selection.removeIds([id]);
  }

  async function onBulk(restore: boolean) {
    const ids = selection.selectedVisible;
    if (!ids.length) return;
    const ok = await confirmAction(
      restore
        ? `Restore ${ids.length} selected inquir${ids.length === 1 ? "y" : "ies"}?`
        : `Archive ${ids.length} selected inquir${ids.length === 1 ? "y" : "ies"}?`,
      {
        danger: !restore,
        confirmLabel: restore ? "Yes, restore" : "Yes, archive",
      }
    );
    if (!ok) return;
    setBulkBusy(true);
    try {
      await setTrashMany("wholesale", ids, restore);
    } catch {
      setBulkBusy(false);
      return;
    }
    setBulkBusy(false);
    const stamp = restore ? null : new Date().toISOString();
    setRows((current) =>
      current.map((row) =>
        ids.includes(row.id) ? { ...row, trashedAt: stamp } : row
      )
    );
    selection.removeIds(ids);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <TrashBinButton
          open={bin}
          count={rows.filter((row) => row.trashedAt).length}
          onToggle={() => {
            setBin((current) => !current);
            selection.clear();
          }}
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ListSelectCheckbox
          checked={selection.allVisibleSelected}
          onChange={selection.toggleAllVisible}
          label="Select all"
        />
        <BulkArchiveBar
          count={selection.selectedVisible.length}
          archivedView={bin}
          busy={bulkBusy}
          onArchive={() => onBulk(false)}
          onRestore={() => onBulk(true)}
          onClear={selection.clear}
        />
      </div>
      {visible.map((row) => (
        <article key={row.id} className="surface rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-white/30 bg-black accent-cyan"
                checked={selection.selected.includes(row.id)}
                onChange={() => selection.toggle(row.id)}
                aria-label={`Select ${row.name}`}
              />
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
              ? "Archive is empty."
              : "No wholesale inquiries yet."
            : "Nothing matches this filter."}
        </p>
      )}
    </div>
  );
}
