"use client";

import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  user?: {
    name: string;
    role: string;
  } | null;
  theme?: "dark" | "light";
};

export function SiteHeader({ user, theme = "dark" }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelHref = user?.role === "admin" ? "/admin" : "/account";
  const light = theme === "light";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md print:hidden",
        light
          ? "border-black/10 bg-white/95"
          : "border-white/10 bg-black/80"
      )}
    >
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6 xl:px-8">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Image
            src={
              light
                ? "/images/logo-4sure-original.png"
                : "/images/logo-4sure-white.png"
            }
            alt="4Sure International"
            width={200}
            height={72}
            className="h-10 w-auto sm:h-12"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition",
                  light
                    ? active
                      ? "bg-mist text-navy"
                      : "text-navy/65 hover:bg-mist hover:text-navy"
                    : active
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Link href={panelHref}>
              <Button variant={light ? "primary" : "secondary"} size="sm">
                {user.role === "admin" ? "Admin" : "My account"}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Open wholesale account</Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md border lg:hidden",
            light
              ? "border-zinc-300 bg-white text-navy"
              : "border-white/15 bg-white/5 text-white"
          )}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div
          className={cn(
            "border-t px-4 py-4 lg:hidden",
            light ? "border-black/10 bg-white" : "border-white/10 bg-black"
          )}
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-3 text-sm font-medium",
                  light
                    ? "text-navy hover:bg-mist"
                    : "text-white hover:bg-white/8"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div
              className={cn(
                "mt-3 flex flex-col gap-2 border-t pt-3",
                light ? "border-black/10" : "border-white/10"
              )}
            >
              {user ? (
                <Link href={panelHref} onClick={() => setOpen(false)}>
                  <Button
                    className="w-full"
                    variant={light ? "primary" : "secondary"}
                  >
                    {user.role === "admin" ? "Admin panel" : "My account"}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button className="w-full" variant="outline">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    <Button className="w-full">Open wholesale account</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
