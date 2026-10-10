import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  createAdminNotice,
  getUserByEmail,
  getUserById,
  syncOrderVerification,
  updateUser,
} from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { profileFieldsSchema } from "@/lib/form-schemas";
import {
  licenseFileError,
  saveLicenseFile,
  type LicenseSlot,
} from "@/lib/license-files";
import {
  isExpiryInPast,
  LICENSE_EXPIRED_MESSAGE,
  profileStatus,
} from "@/lib/profile-status";
import type { ProfileAuditEntry, StoredLicense, User } from "@/lib/types";
import { z } from "zod";

function text(form: FormData, key: string) {
  return String(form.get(key) || "");
}

function uploaded(form: FormData, key: string) {
  const file = form.get(key);
  return file instanceof File && file.size > 0 ? file : null;
}

function audit(user: User, message: string): ProfileAuditEntry[] {
  const entry: ProfileAuditEntry = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    actor: "customer",
    message,
  };
  return [entry, ...(user.profileAudit || [])].slice(0, 40);
}

async function applyLicense(
  user: User,
  slot: LicenseSlot,
  current: StoredLicense | undefined,
  file: File | null,
  expiry: string,
  label: string
): Promise<{ license?: StoredLicense; error?: string; changed: boolean }> {
  const optional = slot !== "primary";
  if (!file && !expiry && !current) return { changed: false };
  if (file) {
    const invalid = licenseFileError(file);
    if (invalid) return { error: invalid, changed: false };
  }
  if ((file || current) && !expiry) {
    return { error: `Enter the expiry date for ${label}.`, changed: false };
  }
  if (expiry && isExpiryInPast(expiry)) {
    return { error: LICENSE_EXPIRED_MESSAGE, changed: false };
  }
  if (!file && !current && expiry) {
    return { error: `Upload the file for ${label}.`, changed: false };
  }
  if (!file && current && isExpiryInPast(current.expiryDate)) {
    return { error: LICENSE_EXPIRED_MESSAGE, changed: false };
  }
  if (!file && current && current.review === "rejected") {
    return {
      error: `Upload a new file for ${label}. The previous file was rejected.`,
      changed: false,
    };
  }
  if (!file && current && current.expiryDate === expiry) {
    return { license: current, changed: false };
  }
  if (!file && !current && optional) return { changed: false };

  const saved = file ? await saveLicenseFile(user.id, slot, file) : null;
  const license: StoredLicense = {
    fileName: saved?.fileName || current?.fileName || "license",
    storedName: saved?.storedName || current?.storedName || "",
    expiryDate: expiry,
    uploadedAt: saved ? new Date().toISOString() : current?.uploadedAt || new Date().toISOString(),
    review: "pending",
  };
  return { license, changed: true };
}

export async function POST(req: Request) {
  const session = await requireSession("retailer");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUserById(session.id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const fields = profileFieldsSchema.parse({
      firstName: text(form, "firstName"),
      lastName: text(form, "lastName"),
      email: text(form, "email"),
      country: text(form, "country"),
      company: text(form, "company"),
      address: text(form, "address"),
      city: text(form, "city"),
      postalCode: text(form, "postalCode"),
      phone: text(form, "phone"),
    });

    const taken = await getUserByEmail(fields.email);
    if (taken && taken.id !== user.id) {
      return NextResponse.json(
        { fieldErrors: { email: "An account with this email already exists." } },
        { status: 400 }
      );
    }

    const primary = await applyLicense(
      user,
      "primary",
      user.license,
      uploaded(form, "licenseFile"),
      text(form, "licenseExpiry").trim(),
      "the tobacco retail dealer's permit"
    );
    const second = await applyLicense(
      user,
      "location2",
      user.license2,
      uploaded(form, "license2File"),
      text(form, "license2Expiry").trim(),
      "the location 2 license"
    );
    const third = await applyLicense(
      user,
      "location3",
      user.license3,
      uploaded(form, "license3File"),
      text(form, "license3Expiry").trim(),
      "the location 3 license"
    );
    const licenseError = primary.error || second.error || third.error;
    if (licenseError) {
      return NextResponse.json({ error: licenseError }, { status: 400 });
    }

    const textChanged =
      fields.firstName !== (user.firstName || "") ||
      fields.lastName !== (user.lastName || "") ||
      fields.email.toLowerCase() !== user.email.toLowerCase() ||
      fields.country !== (user.country || "") ||
      fields.company !== (user.company || "") ||
      fields.address !== (user.address || "") ||
      fields.city !== (user.city || "") ||
      fields.postalCode !== (user.postalCode || "") ||
      fields.phone !== (user.phone || "");
    const licenseChanged = primary.changed || second.changed || third.changed;
    if (!textChanged && !licenseChanged) {
      return NextResponse.json({ ok: true, unchanged: true });
    }

    const next: User = {
      ...user,
      ...fields,
      name: `${fields.firstName} ${fields.lastName}`.trim(),
      verificationReview: "pending",
    };
    if (primary.changed && primary.license) next.license = primary.license;
    if (second.changed && second.license) next.license2 = second.license;
    if (third.changed && third.license) next.license3 = third.license;
    const message = licenseChanged
      ? "Uploaded or updated a license. Profile is pending verification."
      : "Updated profile details. Profile is pending verification.";
    next.profileAudit = audit(user, message);
    const saved = await updateUser(user.id, next);
    if (!saved) {
      return NextResponse.json({ error: "Could not save the profile." }, { status: 400 });
    }
    const status = profileStatus(saved);
    await syncOrderVerification(user.id, status);
    await createAdminNotice({
      userId: user.id,
      userName: saved.name,
      kind: licenseChanged ? "license" : "profile",
      message: `${saved.name}: ${message}`,
      href: `/admin/retailers/${user.id}`,
    });
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ fieldErrors: zodFieldErrors(err) }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not save the profile." }, { status: 400 });
  }
}
