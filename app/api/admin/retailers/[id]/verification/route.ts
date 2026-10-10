import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  createAdminNotice,
  getUserById,
  syncOrderVerification,
  updateUser,
} from "@/lib/db";
import { licenseIsCurrent, profileStatus } from "@/lib/profile-status";
import type { ProfileAuditEntry, StoredLicense, User } from "@/lib/types";
import { z } from "zod";

const bodySchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(500).optional(),
});

function stamp(license: StoredLicense | undefined, decision: "approved" | "rejected", note?: string) {
  if (!license?.storedName) return license;
  return {
    ...license,
    review: decision,
    reviewedAt: new Date().toISOString(),
    reviewNote: note || "",
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const user = await getUserById(id);
  if (!user || user.role !== "retailer") {
    return NextResponse.json({ error: "Retailer not found" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  }
  const { decision, note } = parsed.data;
  if (decision === "approved") {
    if (!user.license?.storedName) {
      return NextResponse.json(
        { error: "This retailer has not uploaded a license." },
        { status: 400 }
      );
    }
    if (!licenseIsCurrent(user.license)) {
      return NextResponse.json(
        { error: "This license is expired and cannot be approved." },
        { status: 400 }
      );
    }
  }

  const message =
    decision === "approved"
      ? "Admin verified the profile and license."
      : `Admin rejected the profile${note ? `: ${note}` : "."}`;
  const entry: ProfileAuditEntry = {
    id: `evt_${Date.now()}`,
    at: new Date().toISOString(),
    actor: "admin",
    message,
  };
  const audit: ProfileAuditEntry[] = [entry, ...(user.profileAudit || [])].slice(0, 40);

  const optional = (license: User["license2"]) => {
    if (!license?.storedName) return license;
    if (decision === "approved" && !licenseIsCurrent(license)) return license;
    return stamp(license, decision, note);
  };
  const patch: Partial<User> = {
    verificationReview: decision,
    license: stamp(user.license, decision, note),
    license2: optional(user.license2),
    license3: optional(user.license3),
    profileAudit: audit,
  };
  const saved = await updateUser(user.id, patch);
  if (!saved) return NextResponse.json({ error: "Could not update verification." }, { status: 400 });
  const status = profileStatus(saved);
  await syncOrderVerification(user.id, status);
  await createAdminNotice({
    userId: user.id,
    userName: saved.name,
    kind: "profile",
    message: `${saved.name}: ${message}`,
    href: `/admin/retailers/${user.id}`,
  });
  return NextResponse.json({ ok: true, status });
}
