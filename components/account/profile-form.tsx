"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import type { FieldErrors } from "@/lib/form-errors";
import { profileFieldsSchema } from "@/lib/form-schemas";
import { isExpiryInPast, LICENSE_EXPIRED_MESSAGE, todayISODate } from "@/lib/profile-status";
import type { User } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70";

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

export function ProfileForm({ user }: { user: Omit<User, "passwordHash"> }) {
  const router = useRouter();
  const guessed = splitName(user.name);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(false);
  const today = todayISODate();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setSaved("");
    const form = new FormData(e.currentTarget);
    const values = {
      firstName: String(form.get("firstName") || ""),
      lastName: String(form.get("lastName") || ""),
      email: String(form.get("email") || ""),
      country: String(form.get("country") || ""),
      company: String(form.get("company") || ""),
      address: String(form.get("address") || ""),
      city: String(form.get("city") || ""),
      postalCode: String(form.get("postalCode") || ""),
      phone: String(form.get("phone") || ""),
    };
    const parsed = profileFieldsSchema.safeParse(values);
    const next: FieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key]) next[key] = issue.message;
      }
    }

    const slots = [
      ["licenseFile", "licenseExpiry", user.license, "licenseExpiry"],
      ["license2File", "license2Expiry", user.license2, "license2Expiry"],
      ["license3File", "license3Expiry", user.license3, "license3Expiry"],
    ] as const;
    for (const [fileKey, expiryKey, current, errorKey] of slots) {
      const file = form.get(fileKey);
      const hasFile = file instanceof File && file.size > 0;
      const expiry = String(form.get(expiryKey) || "").trim();
      if (!hasFile && !current && !expiry) continue;
      if (!hasFile && current && isExpiryInPast(current.expiryDate)) {
        next[errorKey] = LICENSE_EXPIRED_MESSAGE;
        continue;
      }
      if (!hasFile && current && current.review === "rejected") {
        next[errorKey] = "Your license was rejected. Upload a new license file.";
        continue;
      }
      if ((hasFile || current) && !expiry) next[errorKey] = "Enter the license expiry date.";
      if (expiry && isExpiryInPast(expiry)) next[errorKey] = LICENSE_EXPIRED_MESSAGE;
      if (expiry && !hasFile && !current) {
        next[errorKey] = "Upload the license file for this expiry date.";
      }
    }

    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setErrors({});
    setLoading(true);
    const res = await fetch("/api/account/profile", { method: "POST", body: form });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErrors(json.fieldErrors || {});
      setFormError(json.fieldErrors ? "" : json.error || "Could not save the profile.");
      return;
    }
    setSaved(
      json.unchanged
        ? "No changes to save."
        : "Profile saved. Updated details are pending admin verification."
    );
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="surface mt-4 space-y-5 rounded-2xl p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="firstName" label="First name" defaultValue={user.firstName || guessed.first} error={errors.firstName} />
        <Field name="lastName" label="Last name" defaultValue={user.lastName || guessed.last} error={errors.lastName} />
        <Field name="email" label="Email address" type="email" defaultValue={user.email} error={errors.email} />
        <Field name="phone" label="Phone number" type="tel" defaultValue={user.phone || ""} error={errors.phone} />
        <Field name="country" label="Country" defaultValue={user.country || "Canada"} error={errors.country} />
        <Field name="company" label="Company/store name" defaultValue={user.company || ""} error={errors.company} />
        <Field name="address" label="Store address" defaultValue={user.address || ""} error={errors.address} className="sm:col-span-2" />
        <Field name="city" label="City" defaultValue={user.city || ""} error={errors.city} />
        <Field name="postalCode" label="Postal code" defaultValue={user.postalCode || ""} error={errors.postalCode} />
      </div>

      <LicenseFields
        title="Tobacco retail dealer's permit"
        fileName="licenseFile"
        expiryName="licenseExpiry"
        current={user.license}
        userId={user.id}
        slot="primary"
        expiryError={errors.licenseExpiry}
        fileError={errors.licenseFile}
        today={today}
        required
      />
      <LicenseFields
        title="License for location 2 (optional)"
        fileName="license2File"
        expiryName="license2Expiry"
        current={user.license2}
        userId={user.id}
        slot="location2"
        expiryError={errors.license2Expiry}
        fileError={errors.license2File}
        today={today}
      />
      <LicenseFields
        title="License for location 3 (optional)"
        fileName="license3File"
        expiryName="license3Expiry"
        current={user.license3}
        userId={user.id}
        slot="location3"
        expiryError={errors.license3Expiry}
        fileError={errors.license3File}
        today={today}
      />

      {formError && (
        <p className="text-sm text-warn-red" role="alert">
          {formError}
        </p>
      )}
      {saved && <p className="text-sm text-white">{saved}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  error,
  type = "text",
  className = "",
}: {
  name: string;
  label: string;
  defaultValue: string;
  error?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <Input name={name} type={type} defaultValue={defaultValue} />
      <FieldError message={error} />
    </div>
  );
}

function LicenseFields({
  title,
  fileName,
  expiryName,
  current,
  userId,
  slot,
  expiryError,
  fileError,
  today,
  required = false,
}: {
  title: string;
  fileName: string;
  expiryName: string;
  current?: User["license"];
  userId: string;
  slot: string;
  expiryError?: string;
  fileError?: string;
  today: string;
  required?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <p className="text-sm font-semibold text-white">
        {title}
        {required ? "" : ""}
      </p>
      {current?.storedName ? (
        <p className="mt-1 text-sm text-white/70">
          Current file:{" "}
          <Link href={`/api/licenses/${userId}/${slot}`} className="font-semibold text-cyan" target="_blank">
            {current.fileName}
          </Link>
          . Uploading a new file sends it for verification again.
        </p>
      ) : (
        <p className="mt-1 text-sm text-white/60">
          {required ? "A current license file and a future expiry date are required." : "Leave blank if you have only one location."}
        </p>
      )}
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>License file</label>
          <Input name={fileName} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" />
          <FieldError message={fileError} />
        </div>
        <div>
          <label className={labelClass}>Expiry date</label>
          <Input name={expiryName} type="date" min={today} defaultValue={current?.expiryDate || ""} />
          <FieldError message={expiryError} />
        </div>
      </div>
    </div>
  );
}
