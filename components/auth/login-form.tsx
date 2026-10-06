"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import type { FieldErrors } from "@/lib/form-errors";
import { loginSchema } from "@/lib/form-schemas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setLoading(true);
    setErrors({});
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErrors(json.fieldErrors || {});
      setFormError(json.fieldErrors ? "" : json.error || "Sign-in failed. Try again.");
      return;
    }
    router.push(json.user.role === "admin" ? "/admin" : "/account");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="surface space-y-4 rounded-2xl p-6"
    >
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
          Email
        </label>
        <Input name="email" type="email" placeholder="you@store.com" />
        <FieldError message={errors.email} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
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
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-slate-ink">
        New retailer?{" "}
        <Link href="/register" className="font-semibold text-cyan">
          Open an account
        </Link>
      </p>
    </form>
  );
}
