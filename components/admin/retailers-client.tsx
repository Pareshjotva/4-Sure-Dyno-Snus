"use client";

import { TrashAction, TrashBinButton, setTrash } from "@/components/admin/trash-bin";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { FilterBar, matchesQuery } from "@/components/ui/filter-bar";
import { Badge } from "@/components/ui/badge";
import { PROFILE_STATUS_LABEL } from "@/lib/profile-status";
import type { ProfileStatus } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";

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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const pool = rows.filter((user) => (bin ? user.trashedAt : !user.trashedAt));
  const visible = pool.filter(
    (user) =>
      (!status || user.status === status) &&
      matchesQuery(query, user.name, user.company, user.email, user.phone)
  );

  async function onTrash(id: string, restore = false) {
    if (
      !restore &&
      !(await confirmAction(
        "Move this retailer to trash? They will not be able to sign in.",
        { danger: true, confirmLabel: "Yes, move to trash" }
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
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-end">
        <TrashBinButton
          open={bin}
          count={rows.filter((user) => user.trashedAt).length}
          onToggle={() => setBin((current) => !current)}
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
      <div className="space-y-3">
        {visible.map((user) => (
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
            <p className="mt-2 text-xs text-navy/55">
              {user.phone || "No phone"} · Joined {user.joined}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
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
                ? "Trash is empty."
                : "No retailers yet."
              : "Nothing matches this filter."}
          </p>
        )}
      </div>
    </div>
  );
}
