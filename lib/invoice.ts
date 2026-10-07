import type { Order, ProvincePricing, User } from "./types";

export const INVOICE_LETTERHEAD = {
  companyName: "4Sure International",
  address: "27 Royal Street, St Albert, AB T8N7N9",
  gst: "73336 7106 RT0001",
  importLicence: "73336 7106 RM0001",
  exciseDuty: "73336 7106 RD0001",
  albertaTaxCollector: "419452941",
  notice:
    "Until paid in full, this product remains property of 4Sure International inc.",
};

const GST_RATE = 0.05;

function money(amount: number) {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

export function invoiceDateParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Edmonton",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date(iso));
  const read = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const day = read("day");
  const month = read("month");
  const year = read("year");
  return {
    label: `${day}/${month}/${year}`,
    key: `${day}${month}${year}`,
  };
}

export function invoiceNumber(order: Order, orders: Order[]) {
  const stamp = invoiceDateParts(order.createdAt);
  const sameDay = orders
    .filter((row) => invoiceDateParts(row.createdAt).key === stamp.key)
    .sort((a, b) => {
      const delta = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return delta || a.id.localeCompare(b.id);
    });
  const index = sameDay.findIndex((row) => row.id === order.id);
  return `${stamp.key}-${index >= 0 ? index + 1 : 1}`;
}

function descriptionFor(name: string) {
  const base = name.replace(/\s+Slim$/i, "").trim() || name;
  return `${base} 50gms`;
}

export interface InvoiceLine {
  productId: string;
  no: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pttUnit: number;
  totalPtt: number;
  amount: number;
}

export function priceInvoice(
  lines: Pick<InvoiceLine, "productId" | "description" | "quantity" | "unitPrice" | "pttUnit">[],
  discountPercent: number
) {
  const priced = lines.map((line, index) => {
    const quantity = Math.max(0, Number(line.quantity) || 0);
    const unitPrice = money(line.unitPrice);
    const pttUnit = money(line.pttUnit);
    const totalPrice = money(quantity * unitPrice);
    const totalPtt = money(quantity * pttUnit);
    return {
      productId: line.productId,
      no: index + 1,
      description: line.description,
      quantity,
      unitPrice,
      totalPrice,
      pttUnit,
      totalPtt,
      amount: money(totalPrice + totalPtt),
    };
  });
  const subtotal = money(priced.reduce((sum, line) => sum + line.totalPrice, 0));
  const percent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmount = money(subtotal * (percent / 100));
  const ptt = money(priced.reduce((sum, line) => sum + line.totalPtt, 0));
  const totalAmount = money(subtotal - discountAmount + ptt);
  const gst = money(totalAmount * GST_RATE);
  return {
    lines: priced,
    subtotal,
    discountPercent: percent,
    discountAmount,
    ptt,
    totalAmount,
    gst,
    amountDue: money(totalAmount + gst),
  };
}

export interface InvoiceDocumentModel {
  number: string;
  dateLabel: string;
  orderNumber: string;
  billToName: string;
  billToAddress: string;
  billToPhone: string;
  shipToName: string;
  shipToAddress: string;
  shipToPhone: string;
  province: string;
  lines: InvoiceLine[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  discountTier: string;
  ptt: number;
  totalAmount: number;
  gst: number;
  amountDue: number;
}

export function buildInvoice(
  order: Order,
  user: User | null,
  pricing: ProvincePricing[],
  orders: Order[]
): InvoiceDocumentModel {
  const province = (order.province || "").toUpperCase();
  const overrides = order.invoiceOverrides;
  const draftLines = (order.items || []).map((item) => {
    const row = pricing.find(
      (price) =>
        price.productId === item.productId &&
        price.provinceCode.toUpperCase() === province
    );
    const saved = overrides?.lines?.find((line) => line.productId === item.productId);
    return {
      productId: item.productId,
      description: saved?.description?.trim() || descriptionFor(item.productName),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      pttUnit: saved ? money(saved.pttUnit) : money(row?.ptt ?? 0),
    };
  });
  const priced = priceInvoice(draftLines, order.discountPercent || 0);
  const name = user?.company?.trim() || order.company?.trim() || order.userName || "Retailer";
  const address = user?.address?.trim() || province || "—";
  const phone = user?.phone?.trim() || "";

  return {
    number: invoiceNumber(order, orders),
    dateLabel: invoiceDateParts(order.createdAt).label,
    orderNumber: order.orderNumber,
    billToName: overrides?.billToName?.trim() || name,
    billToAddress: overrides?.billToAddress?.trim() || address,
    billToPhone: overrides?.billToPhone?.trim() || phone,
    shipToName: overrides?.shipToName?.trim() || name,
    shipToAddress: overrides?.shipToAddress?.trim() || address,
    shipToPhone: overrides?.shipToPhone?.trim() || phone,
    province,
    lines: priced.lines,
    subtotal: priced.subtotal,
    discountAmount: priced.discountAmount,
    discountPercent: priced.discountPercent,
    discountTier: order.discountTier?.trim() || "",
    ptt: priced.ptt,
    totalAmount: priced.totalAmount,
    gst: priced.gst,
    amountDue: priced.amountDue,
  };
}
