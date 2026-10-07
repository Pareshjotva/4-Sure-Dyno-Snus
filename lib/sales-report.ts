import type { Order } from "@/lib/types";

export type ReportMode = "monthly" | "yearly" | "custom";

export interface ReportRange {
  start: Date;
  end: Date;
  label: string;
}

export interface ProductBreakdown {
  productId: string;
  productName: string;
  packs: number;
  subtotal: number;
}

export interface ProvinceBreakdown {
  province: string;
  orders: number;
  packs: number;
  subtotal: number;
  discountAmount: number;
  total: number;
}

export interface SalesReport {
  label: string;
  orderCount: number;
  cancelledCount: number;
  packCount: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  byProduct: ProductBreakdown[];
  byProvince: ProvinceBreakdown[];
}

export interface CustomRangeResult {
  range: ReportRange | null;
  startError?: string;
  endError?: string;
}

function money(amount: number) {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function currentMonthValue(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export function currentYearValue(now = new Date()) {
  return String(now.getFullYear());
}

export function parseMonthValue(value: string, now = new Date()): ReportRange {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  const fallback = currentMonthValue(now);
  const source = match ? value.trim() : fallback;
  const parsed = /^(\d{4})-(\d{2})$/.exec(source)!;
  let year = Number(parsed[1]);
  let month = Number(parsed[2]);
  if (month < 1 || month > 12) {
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const label = start.toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
  });
  return { start, end, label };
}

export function parseYearValue(value: string, now = new Date()): ReportRange {
  const match = /^(\d{4})$/.exec(value.trim());
  let year = match ? Number(match[1]) : now.getFullYear();
  if (year < 2000 || year > 2100) year = now.getFullYear();
  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end, label: String(year) };
}

export function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function resolveCustomRange(
  startValue: string,
  endValue: string
): CustomRangeResult {
  const startText = startValue.trim();
  const endText = endValue.trim();
  if (!startText && !endText) {
    return { range: null };
  }

  const startDate = startText ? parseDateOnly(startText) : null;
  const endDate = endText ? parseDateOnly(endText) : null;
  const startError = !startText
    ? "Choose a start date."
    : startDate
      ? undefined
      : "Enter a valid start date.";
  const endError = !endText
    ? "Choose an end date."
    : endDate
      ? undefined
      : "Enter a valid end date.";

  if (startError || endError || !startDate || !endDate) {
    return { range: null, startError, endError };
  }

  if (endDate.getTime() < startDate.getTime()) {
    return {
      range: null,
      endError: "End date must be on or after the start date.",
    };
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return {
    range: {
      start,
      end,
      label: `${formatDay(start)} – ${formatDay(end)}`,
    },
  };
}

export function buildSalesReport(orders: Order[], range: ReportRange): SalesReport {
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  const inRange = orders.filter((order) => {
    const created = new Date(order.createdAt).getTime();
    return Number.isFinite(created) && created >= startMs && created <= endMs;
  });
  const active = inRange.filter((order) => order.status !== "cancelled");

  let packCount = 0;
  let subtotal = 0;
  let discountAmount = 0;
  let total = 0;
  const products = new Map<string, ProductBreakdown>();
  const provinces = new Map<string, ProvinceBreakdown>();

  for (const order of active) {
    subtotal = money(subtotal + order.subtotal);
    discountAmount = money(discountAmount + order.discountAmount);
    total = money(total + order.total);

    let orderPacks = 0;
    for (const item of order.items || []) {
      const packs = Number(item.quantity) || 0;
      const lineSubtotal = money(packs * (Number(item.unitPrice) || 0));
      orderPacks += packs;
      const key = item.productId || item.productName || "unknown";
      const row = products.get(key) ?? {
        productId: item.productId || key,
        productName: item.productName || "Unknown product",
        packs: 0,
        subtotal: 0,
      };
      row.packs += packs;
      row.subtotal = money(row.subtotal + lineSubtotal);
      products.set(key, row);
    }

    packCount += orderPacks;
    const province = order.province?.trim() || "Unknown";
    const provinceRow = provinces.get(province) ?? {
      province,
      orders: 0,
      packs: 0,
      subtotal: 0,
      discountAmount: 0,
      total: 0,
    };
    provinceRow.orders += 1;
    provinceRow.packs += orderPacks;
    provinceRow.subtotal = money(provinceRow.subtotal + order.subtotal);
    provinceRow.discountAmount = money(
      provinceRow.discountAmount + order.discountAmount
    );
    provinceRow.total = money(provinceRow.total + order.total);
    provinces.set(province, provinceRow);
  }

  return {
    label: range.label,
    orderCount: active.length,
    cancelledCount: inRange.length - active.length,
    packCount,
    subtotal,
    discountAmount,
    total,
    byProduct: [...products.values()].sort(
      (a, b) => b.packs - a.packs || a.productName.localeCompare(b.productName)
    ),
    byProvince: [...provinces.values()].sort(
      (a, b) => b.total - a.total || a.province.localeCompare(b.province)
    ),
  };
}
