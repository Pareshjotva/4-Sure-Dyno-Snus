"use client";

import type { AdminNotice } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminNotices({ notices }: { notices: AdminNotice[] }) {
  const router = useRouter();
  if (notices.length === 0) return null;

  async function markRead(id: string) {
    await fetch(`/api/admin/notices/${id}`, { method: "POST" });
    router.refresh();
  }

  return (
    <section className="surface mt-6 rounded-2xl p-5">
      <h2 className="font-display text-2xl text-navy">Profile alerts</h2>
      <ul className="mt-4 space-y-3">
        {notices.map((notice) => (
          <li key={notice.id} className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link href={notice.href} className="text-sm font-semibold text-white hover:text-cyan">
                {notice.message}
              </Link>
              <p className="text-xs text-white/50">
                {formatDate(notice.createdAt)}
                {notice.read ? "" : " · New"}
              </p>
            </div>
            {!notice.read && (
              <button
                type="button"
                className="text-xs font-semibold text-cyan"
                onClick={() => markRead(notice.id)}
              >
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
