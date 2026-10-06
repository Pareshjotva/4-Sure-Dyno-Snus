"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { FieldErrors } from "@/lib/form-errors";
import { registerSchema } from "@/lib/form-schemas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

function issuesToFields(issues: { path: PropertyKey[]; message: string }[]) {
  const next: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !next[key]) next[key] = issue.message;
  }
  return next;
}

export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(issuesToFields(parsed.error.issues));
      return;
    }

    setLoading(true);
    setErrors({});
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErrors(json.fieldErrors || {});
      setFormError(
        json.fieldErrors ? "" : json.error || "Unable to create the account. Try again."
      );
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="surface space-y-4 rounded-2xl p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Contact name
          </label>
          <Input name="name" />
          <FieldError message={errors.name} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Business email
          </label>
          <Input name="email" type="email" />
          <FieldError message={errors.email} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Company / store
          </label>
          <Input name="company" />
          <FieldError message={errors.company} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Phone
          </label>
          <Input name="phone" />
          <FieldError message={errors.phone} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Province
          </label>
          <Select name="province" defaultValue="BC">
            <option value="BC">British Columbia</option>
            <option value="AB">Alberta</option>
            <option value="ON">Ontario</option>
          </Select>
          <FieldError message={errors.province} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Tobacco licence #
          </label>
          <Input name="licenceNumber" placeholder="Optional" />
          <FieldError message={errors.licenceNumber} />
          <p className="mt-1 text-xs text-white/55">
            Not needed to register. You can view pricing now. Add the licence
            once, when you place an order.
          </p>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
          Business address
        </label>
        <Input name="address" />
        <FieldError message={errors.address} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
          Password
        </label>
        <Input name="password" type="password" />
        <FieldError message={errors.password} />
      </div>
      {formError && (
        <p className="text-sm text-warn-red" role="alert">
          {formError}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create wholesale account"}
      </Button>
      <p className="text-center text-sm text-slate-ink">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-cyan">
          Sign in
        </Link>
      </p>
    </form>
  );
}
