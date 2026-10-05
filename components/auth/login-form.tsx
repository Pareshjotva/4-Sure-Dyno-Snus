"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Login failed");
      return;
    }
    router.push(json.user.role === "admin" ? "/admin" : "/account");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="surface space-y-4 rounded-2xl p-6">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
          Email
        </label>
        <Input name="email" type="email" required placeholder="you@store.com" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
          Password
        </label>
        <Input name="password" type="password" required minLength={6} />
      </div>
      {error && <p className="text-sm text-warn-red">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-slate-ink">
        New retailer?{" "}
        <Link href="/register" className="font-semibold text-cyan">
          Open an account
        </Link>
      </p>
      <div className="rounded-lg bg-mist p-3 text-xs text-white/70">
        <p className="font-semibold text-white">Demo access</p>
        <p>Admin: admin@4sureinternational.ca / Admin@2026</p>
        <p>Retailer: retailer@demo.com / Retailer@2026</p>
      </div>
    </form>
  );
}
