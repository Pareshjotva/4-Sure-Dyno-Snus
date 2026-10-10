import { RegisterForm } from "@/components/auth/register-form";
import { SiteShell } from "@/components/layout/site-shell";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Open Retailer account" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "admin" ? "/admin" : "/account");
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl text-navy">
          Open a wholesale account
        </h1>
        <p className="mt-2 text-sm text-slate-ink">
          Create your account with your name, email, and phone. Store details
          and your tobacco license are completed in your profile.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </div>
    </SiteShell>
  );
}
