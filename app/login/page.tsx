import { LoginForm } from "@/components/auth/login-form";
import { SiteShell } from "@/components/layout/site-shell";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "admin" ? "/admin" : "/account");
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl text-navy">Retailer sign in</h1>
        <p className="mt-2 text-sm text-slate-ink">
          Access your Dyno Snus wholesale account.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </SiteShell>
  );
}
