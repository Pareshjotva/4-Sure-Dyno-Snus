import type { IncentiveTier, Order } from "@/lib/types";

export function money(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Default slabs when the incentives collection is empty. */
export const DEFAULT_INCENTIVE_TIERS: IncentiveTier[] = [
  {
    id: "tier_growth",
    name: "Tier 1 · Growth",
    minPacks: 20,
    maxPacks: 39,
    discountPercent: 5,
    savePerPack: 2,
  },
  {
    id: "tier_partner",
    name: "Tier 2 · Partner",
    minPacks: 40,
    maxPacks: 59,
    discountPercent: 10,
    savePerPack: 4,
  },
  {
    id: "tier_premium",
    name: "Tier 3 · Premium Volume",
    minPacks: 60,
    maxPacks: null,
    discountPercent: 15,
    savePerPack: 6,
  },
];

export function packCountOf(order: Pick<Order, "items">) {
  return (order.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
}

/** Total discount credited on an order (this-order % + catch-up adjustment). */
export function orderGrantedDiscount(
  order: Pick<Order, "discountAmount" | "discountAdjustment">
) {
  return money(
    (Number(order.discountAmount) || 0) +
      (Number(order.discountAdjustment) || 0)
  );
}

export function isOrderInCalendarMonth(
  order: Pick<Order, "createdAt" | "status">,
  now = new Date()
) {
  if (order.status === "cancelled") return false;
  const created = new Date(order.createdAt).getTime();
  if (!Number.isFinite(created)) return false;
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
  return created >= start && created <= end;
}

export function monthOrders(orders: Order[], now = new Date()) {
  return orders
    .filter((order) => isOrderInCalendarMonth(order, now))
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function resolveIncentive(
  packCount: number,
  tiers: IncentiveTier[]
): IncentiveTier | null {
  const sorted = [...tiers].sort((a, b) => b.minPacks - a.minPacks);
  return (
    sorted.find((tier) => {
      if (packCount < tier.minPacks) return false;
      if (tier.maxPacks === null) return true;
      return packCount <= tier.maxPacks;
    }) ?? null
  );
}

export type CumulativeDiscountQuote = {
  monthPacksBefore: number;
  monthSubtotalBefore: number;
  previouslyGranted: number;
  orderPacks: number;
  orderSubtotal: number;
  qualifyingPacks: number;
  monthEligibleAmount: number;
  tier: IncentiveTier | null;
  discountPercent: number;
  /** Final monthly discount on all eligible purchases at the unlocked rate. */
  finalMonthlyDiscount: number;
  /** Catch-up credit for earlier orders this month (does not rewrite prior invoices). */
  discountAdjustment: number;
  /** Percent discount on the current order subtotal only. */
  discountAmount: number;
  /** Total credit applied on this order. */
  totalDiscountOnOrder: number;
  total: number;
};

/**
 * Cumulative calendar-month volume discount.
 * Prior invoices stay unchanged; missed catch-up is credited on the new order.
 */
export function quoteCumulativeDiscount({
  orderPacks,
  orderSubtotal,
  priorMonthOrders = [],
  monthPacksBefore: packsBeforeOverride,
  monthSubtotalBefore: subtotalBeforeOverride,
  previouslyGranted: grantedOverride,
  tiers,
}: {
  orderPacks: number;
  orderSubtotal: number;
  priorMonthOrders?: Order[];
  monthPacksBefore?: number;
  monthSubtotalBefore?: number;
  previouslyGranted?: number;
  tiers: IncentiveTier[];
}): CumulativeDiscountQuote {
  const packs = Math.max(0, orderPacks);
  const subtotal = money(Math.max(0, orderSubtotal));
  const monthPacksBefore =
    packsBeforeOverride ??
    priorMonthOrders.reduce((sum, order) => sum + packCountOf(order), 0);
  const monthSubtotalBefore = money(
    subtotalBeforeOverride ??
      priorMonthOrders.reduce(
        (sum, order) => sum + (Number(order.subtotal) || 0),
        0
      )
  );
  const previouslyGranted = money(
    grantedOverride ??
      priorMonthOrders.reduce((sum, order) => sum + orderGrantedDiscount(order), 0)
  );

  const qualifyingPacks = monthPacksBefore + packs;
  const monthEligibleAmount = money(monthSubtotalBefore + subtotal);
  const tier = resolveIncentive(qualifyingPacks, tiers);
  const discountPercent = tier?.discountPercent ?? 0;

  const finalMonthlyDiscount = money(
    monthEligibleAmount * (discountPercent / 100)
  );
  const totalDiscountOnOrder = money(
    Math.max(0, finalMonthlyDiscount - previouslyGranted)
  );

  const currentOrderDiscount = money(subtotal * (discountPercent / 100));
  const catchUpTarget = money(
    Math.max(0, money(monthSubtotalBefore * (discountPercent / 100)) - previouslyGranted)
  );

  // Keep current + adjustment = total credit (handles rounding).
  let discountAdjustment = money(
    Math.min(catchUpTarget, totalDiscountOnOrder)
  );
  let discountAmount = money(totalDiscountOnOrder - discountAdjustment);
  if (discountAmount < 0) {
    discountAdjustment = totalDiscountOnOrder;
    discountAmount = 0;
  }

  return {
    monthPacksBefore,
    monthSubtotalBefore,
    previouslyGranted,
    orderPacks: packs,
    orderSubtotal: subtotal,
    qualifyingPacks,
    monthEligibleAmount,
    tier,
    discountPercent,
    finalMonthlyDiscount,
    discountAdjustment,
    discountAmount,
    totalDiscountOnOrder,
    total: money(subtotal - totalDiscountOnOrder),
  };
}

/** Customer-wise monthly rollup for admin views. */
export function monthlyDiscountSummary(orders: Order[], now = new Date()) {
  const rows = monthOrders(orders, now);
  const packs = rows.reduce((sum, order) => sum + packCountOf(order), 0);
  const eligibleAmount = money(
    rows.reduce((sum, order) => sum + (Number(order.subtotal) || 0), 0)
  );
  const granted = money(
    rows.reduce((sum, order) => sum + orderGrantedDiscount(order), 0)
  );
  const last = rows[rows.length - 1];
  return {
    orders: rows,
    packs,
    eligibleAmount,
    granted,
    discountPercent: last?.discountPercent ?? 0,
    discountTier: last?.discountTier ?? "",
  };
}
