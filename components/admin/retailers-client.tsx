"use client";

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
};

export function AdminRetailersClient({ retailers }: { retailers: RetailerCard[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const visible = retailers.filter(
    (user) =>
      (!status || user.status === status) &&
      matchesQuery(query, user.name, user.company, user.email, user.phone)
  );

  return (
    <div className="mt-6 space-y-4">
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
            <Link
              href={`/admin/retailers/${user.id}`}
              className="mt-2 inline-block text-sm font-semibold text-cyan"
            >
              Review profile
            </Link>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-slate-ink">
            {retailers.length === 0 ? "No retailers yet." : "Nothing matches this filter."}
          </p>
        )}
      </div>
    </div>
  );
}
