"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PROFILE_STATUS_LABEL } from "@/lib/profile-status";
import type { ProfileAuditEntry, ProfileStatus, StoredLicense } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RetailerReview({
  userId,
  status,
  licenses,
  audit,
}: {
  userId: string;
  status: ProfileStatus;
  licenses: { slot: string; label: string; license?: StoredLicense }[];
  audit: ProfileAuditEntry[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);

  async function decide(decision: "approved" | "rejected") {
    setError("");
    setLoading(decision);
    const res = await fetch(`/api/admin/retailers/${userId}/verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
    });
    const json = await res.json();
    setLoading(null);
    if (!res.ok) {
      setError(json.error || "Could not update verification.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="surface rounded-2xl p-5">
        <p className="text-sm font-semibold text-white">Verification</p>
        <p className="mt-1 text-sm text-white/75">{PROFILE_STATUS_LABEL[status]}</p>
        <div className="mt-4 space-y-3">
          {licenses.map((item) => (
            <div key={item.slot} className="text-sm text-white/80">
              <p className="font-semibold text-white">{item.label}</p>
              {item.license?.storedName ? (
                <p className="mt-1">
                  <Link
                    href={`/api/licenses/${userId}/${item.slot}`}
                    className="font-semibold text-cyan"
                    target="_blank"
                  >
                    {item.license.fileName}
                  </Link>
                  {" · expires "}
                  {item.license.expiryDate}
                  {" · "}
                  {item.license.review}
                </p>
              ) : (
                <p className="mt-1 text-white/50">Not uploaded</p>
              )}
            </div>
          ))}
        </div>
        <label className="mb-1 mt-4 block text-xs font-semibold uppercase tracking-wide text-white/70">
          Note for a rejection
        </label>
        <Textarea name="note" value={note} onChange={(e) => setNote(e.target.value)} />
        {error && (
          <p className="mt-3 text-sm text-warn-red" role="alert">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button disabled={loading !== null} onClick={() => decide("approved")}>
            {loading === "approved" ? "Saving…" : "Approve profile"}
          </Button>
          <Button
            variant="outline"
            disabled={loading !== null}
            onClick={() => decide("rejected")}
          >
            {loading === "rejected" ? "Saving…" : "Reject profile"}
          </Button>
        </div>
      </div>

      <div className="surface rounded-2xl p-5">
        <p className="text-sm font-semibold text-white">Profile history</p>
        <ul className="mt-3 space-y-2 text-sm text-white/75">
          {audit.length === 0 && <li>No profile updates yet.</li>}
          {audit.map((entry) => (
            <li key={entry.id}>
              {formatDate(entry.at)} · {entry.actor} · {entry.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
