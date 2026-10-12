"use client";

import { Badge } from "@/components/ui/badge";
import { PROFILE_STATUS_LABEL } from "@/lib/profile-status";
import type { ProfileStatus } from "@/lib/types";
import { Download, Eye, FileText } from "lucide-react";
import Link from "next/link";

export type VerificationRow = {
  id: string;
  name: string;
  company: string;
  email: string;
  status: ProfileStatus;
  uploadedAt: string;
  documents: {
    slot: string;
    label: string;
    fileName: string;
    expiryDate: string;
    review: string;
  }[];
};

export function AdminVerificationsClient({
  rows,
}: {
  rows: VerificationRow[];
}) {
  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-slate-ink">
        {rows.length} retailer{rows.length === 1 ? "" : "s"} with license
        documents waiting for verification.
      </p>
      {rows.map((row) => (
        <article key={row.id} className="surface rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white">{row.name}</p>
              <p className="text-sm text-white/70">
                {row.company || "No store name"} · {row.email}
              </p>
              <p className="mt-1 text-xs text-white/50">
                Latest upload {row.uploadedAt}
              </p>
            </div>
            <Badge className="bg-warn-yellow/15 text-warn-yellow">
              {PROFILE_STATUS_LABEL[row.status]}
            </Badge>
          </div>

          <div className="mt-4 space-y-2">
            {row.documents.map((doc) => (
              <div
                key={doc.slot}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 rounded-md bg-white/5 p-2 text-cyan">
                    <FileText size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {doc.label}
                    </p>
                    <p className="truncate text-sm text-white/75">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-white/50">
                      Expires {doc.expiryDate} · {doc.review}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/api/licenses/${row.id}/${doc.slot}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-cyan hover:text-cyan"
                  >
                    <Eye size={14} /> View
                  </Link>
                  <Link
                    href={`/api/licenses/${row.id}/${doc.slot}?download=1`}
                    className="inline-flex items-center gap-1 rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-cyan hover:text-cyan"
                  >
                    <Download size={14} /> Download
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Link
              href={`/admin/retailers/${row.id}`}
              className="text-sm font-semibold text-cyan"
            >
              Open verify / review page →
            </Link>
          </div>
        </article>
      ))}
      {rows.length === 0 && (
        <p className="text-sm text-slate-ink">
          No license uploads are waiting for verification.
        </p>
      )}
    </div>
  );
}
