"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import type { FieldErrors } from "@/lib/form-errors";
import { licenceNumberSchema } from "@/lib/form-schemas";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LicenceForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const value = String(new FormData(e.currentTarget).get("licenceNumber") || "");
    const parsed = licenceNumberSchema.safeParse(value);
    if (!parsed.success) {
      setErrors({
        licenceNumber:
          parsed.error.issues[0]?.message || "Enter the tobacco licence number.",
      });
      return;
    }

    setErrors({});
    setLoading(true);
    const res = await fetch("/api/account/licence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenceNumber: parsed.data }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErrors(json.fieldErrors || {});
      setFormError(
        json.fieldErrors ? "" : json.error || "Could not save the licence number."
      );
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="surface mt-4 rounded-2xl p-5">
      <p className="text-sm font-semibold text-white">Add tobacco licence</p>
      <p className="mt-1 text-sm text-white/70">
        Enter it once. After it is saved, you will not be asked again.
      </p>
      <div className="mt-4 max-w-md">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
          Tobacco licence #
        </label>
        <Input name="licenceNumber" />
        <FieldError message={errors.licenceNumber} />
      </div>
      {formError && (
        <p className="mt-3 text-sm text-warn-red" role="alert">
          {formError}
        </p>
      )}
      <Button type="submit" className="mt-4" disabled={loading}>
        {loading ? "Saving…" : "Save licence"}
      </Button>
    </form>
  );
}
