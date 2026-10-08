"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import type { FieldErrors } from "@/lib/form-errors";
import { siteContactSchema } from "@/lib/form-schemas";
import { FormEvent, useState } from "react";

type ContactDraft = {
  phone: string;
  email: string;
  secondaryEmail: string;
  address: string;
  website: string;
  salesContact: string;
};

const fields: { key: keyof ContactDraft; label: string; hint?: string }[] = [
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  {
    key: "secondaryEmail",
    label: "Second email",
    hint: "Also used as the invoice payment email.",
  },
  { key: "address", label: "Office address" },
  { key: "website", label: "Website" },
  { key: "salesContact", label: "Sales contact" },
];

export function AdminContactClient({ contact }: { contact: ContactDraft }) {
  const [draft, setDraft] = useState<ContactDraft>(contact);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    const parsed = siteContactSchema.safeParse(draft);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/admin/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.fieldErrors) {
          setFieldErrors(json.fieldErrors);
          return;
        }
        throw new Error(json.error || "Unable to save contact details.");
      }
      setDraft({
        phone: json.site.phone,
        email: json.site.email,
        secondaryEmail: json.site.secondaryEmail,
        address: json.site.address,
        website: json.site.website,
        salesContact: json.site.salesContact,
      });
      setMessage("Contact details saved. They now appear everywhere on the site.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save contact details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {message && (
        <p className="text-sm text-cyan" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-warn-red" role="alert">
          {error}
        </p>
      )}
      <div className="surface space-y-4 rounded-2xl p-5">
        {fields.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={field.key}
              className="mb-1 block text-xs uppercase tracking-wide text-white/50"
            >
              {field.label}
            </label>
            <Input
              id={field.key}
              type={field.key === "email" || field.key === "secondaryEmail" ? "email" : "text"}
              value={draft[field.key]}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
            />
            {field.hint ? (
              <p className="mt-1 text-xs text-white/45">{field.hint}</p>
            ) : null}
            <FieldError message={fieldErrors[field.key]} />
          </div>
        ))}
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save contact details"}
        </Button>
      </div>
    </form>
  );
}
