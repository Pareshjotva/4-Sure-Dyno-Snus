import type { OrderStatus } from "./types";

/** Volume discount milestones — matches client Retailer Incentive Program PPT. */
export const VOLUME_MILESTONES = [
  { packs: 20, maxPacks: 40, percent: 5, label: "Tier 1", name: "Growth" },
  { packs: 41, maxPacks: 60, percent: 10, label: "Tier 2", name: "Partner" },
  {
    packs: 80,
    maxPacks: null as number | null,
    percent: 15,
    label: "Tier 3",
    name: "Premium Volume",
  },
] as const;

export function activeVolumeMilestone(totalPacks: number) {
  return [...VOLUME_MILESTONES].reverse().find((m) => {
    if (totalPacks < m.packs) return false;
    if (m.maxPacks == null) return true;
    return totalPacks <= m.maxPacks;
  });
}

const INVOICE_STATUSES: OrderStatus[] = [
  "accepted",
  "confirmed",
  "shipped",
  "delivered",
];

/** Invoice is available only after admin accepts (or later fulfilment statuses). */
export function isInvoiceAvailable(status: OrderStatus | string) {
  return INVOICE_STATUSES.includes(status as OrderStatus);
}

export function orderStatusLabel(status: OrderStatus | string) {
  if (status === "confirmed") return "accepted";
  return status;
}

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "accepted",
  "shipped",
  "delivered",
  "cancelled",
];

/** Normalize legacy "confirmed" to "accepted" when writing. */
export function normalizeOrderStatus(status: string): OrderStatus {
  if (status === "confirmed") return "accepted";
  if (ORDER_STATUSES.includes(status as OrderStatus)) {
    return status as OrderStatus;
  }
  if (status === "accepted") return "accepted";
  return "pending";
}
