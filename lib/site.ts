import type { IncentiveTier, Order } from "./types";

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

export function quoteVolumeDiscount(
  orderPacks: number,
  monthPacksBefore: number,
  tiers: IncentiveTier[],
  subtotal: number
) {
  const qualifyingPacks = Math.max(0, orderPacks) + Math.max(0, monthPacksBefore);
  const tier = resolveIncentive(qualifyingPacks, tiers);
  const discountPercent = tier?.discountPercent ?? 0;
  const discountAmount =
    Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const total = Math.round((subtotal - discountAmount) * 100) / 100;
  return {
    qualifyingPacks,
    tier,
    discountPercent,
    discountAmount,
    total,
  };
}

export function packsThisMonth(orders: Order[], now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  ).getTime();
  return orders.reduce((sum, order) => {
    if (order.status === "cancelled") return sum;
    const created = new Date(order.createdAt).getTime();
    if (!Number.isFinite(created) || created < start || created > end) return sum;
    const packs = (order.items || []).reduce(
      (packsSum, item) => packsSum + (Number(item.quantity) || 0),
      0
    );
    return sum + packs;
  }, 0);
}

export function discountTierLabel(percent: number, stored?: string) {
  if (stored?.trim()) return stored.trim();
  if (percent >= 15) return "Tier 3 · Premium Volume";
  if (percent >= 10) return "Tier 2 · Partner";
  if (percent >= 5) return "Tier 1 · Growth";
  return "";
}

export const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/incentives", label: "Retailer Program" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://4sureinternational.ca";

export const COMPANY_EMAILS = [
  "info@4sureinternational.ca",
  "4sureinternational@gmail.com",
] as const;

const HIDDEN_EMAILS = ["octavio4sure@gmail.com"];

export function contactEmails(primary?: string) {
  const emails: string[] = [...COMPANY_EMAILS];
  const extra = primary?.trim();
  if (
    extra &&
    !emails.some((email) => email.toLowerCase() === extra.toLowerCase()) &&
    !HIDDEN_EMAILS.some((email) => email.toLowerCase() === extra.toLowerCase())
  ) {
    emails.push(extra);
  }
  return emails;
}
