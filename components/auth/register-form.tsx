"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
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

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70";

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
    router.push("/account/profile");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="surface space-y-4 rounded-2xl p-6">
      <div>
        <label className={labelClass}>Name</label>
        <Input name="name" autoComplete="name" />
        <FieldError message={errors.name} />
      </div>
      <div>
        <label className={labelClass}>Email address</label>
        <Input name="email" type="email" autoComplete="email" />
        <FieldError message={errors.email} />
      </div>
      <div>
        <label className={labelClass}>Phone number</label>
        <Input name="phone" type="tel" autoComplete="tel" />
        <FieldError message={errors.phone} />
      </div>
      <div>
        <label className={labelClass}>Password</label>
        <Input name="password" type="password" autoComplete="new-password" />
        <FieldError message={errors.password} />
      </div>
      <p className="text-sm text-white/60">
        Store details and your tobacco license are added in your profile after
        you create the account.
      </p>
      {formError && (
        <p className="text-sm text-warn-red" role="alert">
          {formError}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
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
