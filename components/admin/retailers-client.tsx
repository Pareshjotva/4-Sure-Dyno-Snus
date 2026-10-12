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
import { Badge } from "@/components/ui/badge";
import { PROFILE_STATUS_LABEL } from "@/lib/profile-status";
import type { ProfileStatus } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";

export type RetailerCard = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  joined: string;
  status: ProfileStatus;
  trashedAt?: string | null;
};

export function AdminRetailersClient({ retailers }: { retailers: RetailerCard[] }) {
  const [rows, setRows] = useState(retailers);
  const [bin, setBin] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const pool = rows.filter((user) => (bin ? user.trashedAt : !user.trashedAt));
  const visible = pool.filter(
    (user) =>
      (!status || user.status === status) &&
      matchesQuery(query, user.name, user.company, user.email, user.phone)
  );
  const visibleIds = useMemo(() => visible.map((user) => user.id), [visible]);
  const selection = useListSelection(visibleIds);

  async function onTrash(id: string, restore = false) {
    if (
      !restore &&
      !(await confirmAction(
        "Archive this retailer? They will not be able to sign in.",
        { danger: true, confirmLabel: "Yes, archive" }
      ))
    ) {
      return;
    }
    setBusy(id);
    try {
      await setTrash("retailer", id, restore);
    } catch {
      setBusy(null);
      return;
    }
    setBusy(null);
    const stamp = restore ? null : new Date().toISOString();
    setRows((current) =>
      current.map((user) => (user.id === id ? { ...user, trashedAt: stamp } : user))
    );
    selection.removeIds([id]);
  }

  async function onBulk(restore: boolean) {
    const ids = selection.selectedVisible;
    if (!ids.length) return;
    const ok = await confirmAction(
      restore
        ? `Restore ${ids.length} selected retailer${ids.length === 1 ? "" : "s"}?`
        : `Archive ${ids.length} selected retailer${ids.length === 1 ? "" : "s"}? They will not be able to sign in.`,
      {
        danger: !restore,
        confirmLabel: restore ? "Yes, restore" : "Yes, archive",
      }
    );
    if (!ok) return;
    setBulkBusy(true);
    try {
      await setTrashMany("retailer", ids, restore);
    } catch {
      setBulkBusy(false);
      return;
    }
    setBulkBusy(false);
    const stamp = restore ? null : new Date().toISOString();
    setRows((current) =>
      current.map((user) =>
        ids.includes(user.id) ? { ...user, trashedAt: stamp } : user
      )
    );
    selection.removeIds(ids);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-end">
        <TrashBinButton
          open={bin}
          count={rows.filter((user) => user.trashedAt).length}
          onToggle={() => {
            setBin((current) => !current);
            selection.clear();
          }}
        />
      </div>
      <FilterBar
        query={query}
        onQuery={setQuery}
        placeholder="Search name, store, or email"
        status={status}
        onStatus={setStatus}
        statuses={(Object.keys(PROFILE_STATUS_LABEL) as ProfileStatus[]).map((value) => ({
          value,
          label: PROFILE_STATUS_LABEL[value],
        }))}
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
      <div className="space-y-3">
        {visible.map((user) => (
          <div key={user.id} className="surface rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-black accent-cyan"
                  checked={selection.selected.includes(user.id)}
                  onChange={() => selection.toggle(user.id)}
                  aria-label={`Select ${user.name}`}
                />
                <div>
                  <p className="font-semibold text-navy">{user.name}</p>
                  <p className="text-sm text-slate-ink">
                    {user.company || "No store name yet"} · {user.email}
                  </p>
                </div>
              </div>
              <Badge
                className={
                  user.status === "verified"
                    ? ""
                    : user.status === "rejected" || user.status === "expired"
                      ? "bg-warn-red/15 text-warn-red"
                      : "bg-warn-yellow/15 text-warn-yellow"
                }
              >
                {PROFILE_STATUS_LABEL[user.status]}
              </Badge>
            </div>
            <p className="mt-2 pl-7 text-xs text-navy/55">
              {user.phone || "No phone"} · Joined {user.joined}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 pl-7">
              {!bin && (
                <Link
                  href={`/admin/retailers/${user.id}`}
                  className="text-sm font-semibold text-cyan"
                >
                  Review profile
                </Link>
              )}
              <TrashAction
                trashed={Boolean(user.trashedAt)}
                busy={busy === user.id}
                onTrash={() => onTrash(user.id)}
                onRestore={() => onTrash(user.id, true)}
              />
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-slate-ink">
            {pool.length === 0
              ? bin
                ? "Archive is empty."
                : "No retailers yet."
              : "Nothing matches this filter."}
          </p>
        )}
      </div>
    </div>
  );
}
