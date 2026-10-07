import { LoginForm } from "@/components/auth/login-form";
import { SiteShell } from "@/components/layout/site-shell";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "retailer") redirect("/account");

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl text-navy">Admin sign in</h1>
        <p className="mt-2 text-sm text-slate-ink">
          Staff access for 4Sure International. Retailer accounts use the shop
          sign-in.
        </p>
        <div className="mt-6">
          <LoginForm audience="admin" />
        </div>
      </div>
    </SiteShell>
  );
}
