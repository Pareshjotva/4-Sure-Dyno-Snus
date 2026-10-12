"use client";

import { Button } from "@/components/ui/button";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { PROFILE_STATUS_LABEL } from "@/lib/profile-status";
import type { ProfileAuditEntry, ProfileStatus, StoredLicense } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Download, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function reviewTone(review?: StoredLicense["review"]) {
  if (review === "approved") return "bg-cyan/20 text-cyan";
  if (review === "rejected") return "bg-warn-red/15 text-warn-red";
  return "bg-warn-yellow/15 text-warn-yellow";
}

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
  const uploaded = licenses.filter((item) => item.license?.storedName);

  async function decide(decision: "approved" | "rejected") {
    const ok = await confirmAction(
      decision === "approved"
        ? "Approve this retailer profile and licenses?"
        : "Reject this retailer profile?",
      {
        confirmLabel:
          decision === "approved" ? "Yes, approve" : "Yes, reject",
        danger: decision === "rejected",
      }
    );
    if (!ok) return;
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">License verification</p>
            <p className="mt-1 text-sm text-white/75">
              {PROFILE_STATUS_LABEL[status]}
            </p>
          </div>
          <p className="text-xs text-white/55">
            {uploaded.length} document{uploaded.length === 1 ? "" : "s"} uploaded
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {licenses.map((item) => {
            const license = item.license;
            const href = `/api/licenses/${userId}/${item.slot}`;
            if (!license?.storedName) {
              return (
                <div
                  key={item.slot}
                  className="rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm text-white/45"
                >
                  <p className="font-semibold text-white/70">{item.label}</p>
                  <p className="mt-1">Not uploaded</p>
                </div>
              );
            }
            return (
              <div
                key={item.slot}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 rounded-md bg-white/5 p-2 text-cyan">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {item.label}
                      </p>
                      <p className="mt-1 truncate text-sm text-white/80">
                        {license.fileName}
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        Uploaded {formatDate(license.uploadedAt)} · expires{" "}
                        {license.expiryDate}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${reviewTone(license.review)}`}
                      >
                        {license.review}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={href}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-cyan hover:text-cyan"
                    >
                      <Eye size={14} /> View
                    </Link>
                    <Link
                      href={`${href}?download=1`}
                      className="inline-flex items-center gap-1 rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-cyan hover:text-cyan"
                    >
                      <Download size={14} /> Download
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <label className="mb-1 mt-4 block text-xs font-semibold uppercase tracking-wide text-white/70">
          Note for a rejection
        </label>
        <Textarea
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && (
          <p className="mt-3 text-sm text-warn-red" role="alert">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button disabled={loading !== null} onClick={() => decide("approved")}>
            {loading === "approved" ? "Saving…" : "Approve / Verify"}
          </Button>
          <Button
            variant="outline"
            disabled={loading !== null}
            onClick={() => decide("rejected")}
          >
            {loading === "rejected" ? "Saving…" : "Reject"}
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
