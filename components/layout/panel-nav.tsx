"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const accountLinks = [
  { href: "/account", label: "Overview" },
  { href: "/account/program", label: "Retailer Program" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/order/new", label: "Place order" },
  { href: "/account/pricing", label: "Pricing" },
  { href: "/account/profile", label: "Profile" },
];

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/retailers", label: "Retailers" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/wholesale-inquiries", label: "Wholesale Inquiry" },
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/admin/faqs", label: "FAQ" },
];

export function PanelNav({
  mode,
  userName,
}: {
  mode: "account" | "admin";
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const links = mode === "admin" ? adminLinks : accountLinks;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(mode === "admin" ? "/admin/login" : "/login");
    router.refresh();
  }

  return (
    <aside className="surface rounded-2xl p-4 print:hidden">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan">
        {mode === "admin" ? "Admin panel" : "Retailer panel"}
      </p>
      <p className="mt-1 font-display text-2xl text-white">{userName}</p>
      <nav className="mt-4 flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition",
              pathname === link.href ||
                (link.href !== "/account" &&
                  link.href !== "/admin" &&
                  pathname.startsWith(link.href + "/"))
                ? "bg-cyan text-white"
                : "text-white/70 hover:bg-white/8 hover:text-white"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-4 border-t border-white/10 pt-4">
        <Link href="/" className="mb-2 block text-sm text-cyan hover:underline">
          ← Back to site
        </Link>
        <Button variant="outline" size="sm" className="w-full" data-page-action onClick={logout}>
          Sign out
        </Button>
      </div>
    </aside>
  );
}
