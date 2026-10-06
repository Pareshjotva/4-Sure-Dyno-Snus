import type { IncentiveTier } from "./types";

export function resolveIncentive(
  packCount: number,
  tiers: IncentiveTier[]
): IncentiveTier | null {
  const sorted = [...tiers].sort((a, b) => b.minPacks - a.minPacks);
  return sorted.find((tier) => {
    if (packCount < tier.minPacks) return false;
    if (tier.maxPacks === null) return true;
    return packCount <= tier.maxPacks;
  }) ?? null;
}

export const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/pricing", label: "Wholesale Pricing" },
  { href: "/incentives", label: "Retailer Program" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://4sureinternational.ca";

export const COMPANY_EMAILS = [
  "info@4sureinternational.ca",
  "4sureinternational@gmail.com",
] as const;

export function contactEmails(primary?: string) {
  const emails: string[] = [...COMPANY_EMAILS];
  const extra = primary?.trim();
  if (
    extra &&
    !emails.some((email) => email.toLowerCase() === extra.toLowerCase())
  ) {
    emails.push(extra);
  }
  return emails;
}
