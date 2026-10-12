import type { IncentiveTier, Order } from "./types";
import {
  monthOrders,
  packCountOf,
  quoteCumulativeDiscount,
} from "./volume-discount";

export { resolveIncentive } from "./volume-discount";

/** Preview / place-order helper using cumulative monthly discount rules. */
export function quoteVolumeDiscount(
  orderPacks: number,
  monthPacksBefore: number,
  tiers: IncentiveTier[],
  subtotal: number,
  extras?: {
    monthSubtotalBefore?: number;
    previouslyGranted?: number;
    priorMonthOrders?: Order[];
  }
) {
  const quote = quoteCumulativeDiscount({
    orderPacks,
    orderSubtotal: subtotal,
    priorMonthOrders: extras?.priorMonthOrders,
    monthPacksBefore,
    monthSubtotalBefore: extras?.monthSubtotalBefore,
    previouslyGranted: extras?.previouslyGranted,
    tiers,
  });

  return {
    qualifyingPacks: quote.qualifyingPacks,
    tier: quote.tier,
    discountPercent: quote.discountPercent,
    discountAmount: quote.discountAmount,
    discountAdjustment: quote.discountAdjustment,
    totalDiscountOnOrder: quote.totalDiscountOnOrder,
    finalMonthlyDiscount: quote.finalMonthlyDiscount,
    previouslyGranted: quote.previouslyGranted,
    monthSubtotalBefore: quote.monthSubtotalBefore,
    total: quote.total,
  };
}

export function packsThisMonth(orders: Order[], now = new Date()) {
  return monthOrders(orders, now).reduce(
    (sum, order) => sum + packCountOf(order),
    0
  );
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
  { href: "/retailer", label: "Retailer Program" },
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

export function contactEmails(primary?: string, saved?: string[]) {
  const listed = (saved || []).map((email) => email.trim()).filter(Boolean);
  if (listed.length > 0) {
    const chosen: string[] = [];
    for (const email of listed) {
      const hidden = HIDDEN_EMAILS.some(
        (item) => item.toLowerCase() === email.toLowerCase()
      );
      const duplicate = chosen.some(
        (item) => item.toLowerCase() === email.toLowerCase()
      );
      if (!hidden && !duplicate) chosen.push(email);
    }
    if (chosen.length > 0) return chosen;
  }

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

export function publicEmails(site: { email?: string; emails?: string[] }) {
  return contactEmails(site.email, site.emails);
}
