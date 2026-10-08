import type { OrderStatus } from "./types";

/** Volume discount milestones (packs combined this calendar month). */
export const VOLUME_MILESTONES = [
  { packs: 40, percent: 5, label: "Tier A", name: "Growth" },
  { packs: 60, percent: 10, label: "Tier B", name: "Partner" },
  { packs: 80, percent: 15, label: "Tier C", name: "Premium Volume" },
] as const;

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
