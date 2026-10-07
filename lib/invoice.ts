import type { Order, ProvincePricing, User } from "./types";

export const INVOICE_LETTERHEAD = {
  companyName: "4Sure International",
  address: "27 Royal Street, St Albert, AB T8N7N9",
  email: "4sureinternational@gmail.com",
  phone: "587-456-2417",
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
  no: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pttUnit: number;
  totalPtt: number;
  amount: number;
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
  const lines = (order.items || []).map((item, index) => {
    const row = pricing.find(
      (price) =>
        price.productId === item.productId &&
        price.provinceCode.toUpperCase() === province
    );
    const pttUnit = money(row?.ptt ?? 0);
    const totalPrice = money(item.quantity * item.unitPrice);
    const totalPtt = money(item.quantity * pttUnit);
    return {
      no: index + 1,
      description: descriptionFor(item.productName),
      quantity: item.quantity,
      unitPrice: money(item.unitPrice),
      totalPrice,
      pttUnit,
      totalPtt,
      amount: money(totalPrice + totalPtt),
    };
  });

  const subtotal = money(order.subtotal);
  const discountAmount = money(order.discountAmount);
  const ptt = money(lines.reduce((sum, line) => sum + line.totalPtt, 0));
  const totalAmount = money(subtotal - discountAmount + ptt);
  const gst = money(totalAmount * GST_RATE);
  const name = user?.company?.trim() || order.company?.trim() || order.userName || "Retailer";
  const address = user?.address?.trim() || province || "—";
  const phone = user?.phone?.trim() || "";

  return {
    number: invoiceNumber(order, orders),
    dateLabel: invoiceDateParts(order.createdAt).label,
    orderNumber: order.orderNumber,
    billToName: name,
    billToAddress: address,
    billToPhone: phone,
    shipToName: name,
    shipToAddress: address,
    shipToPhone: phone,
    province,
    lines,
    subtotal,
    discountAmount,
    discountPercent: order.discountPercent || 0,
    discountTier: order.discountTier?.trim() || "",
    ptt,
    totalAmount,
    gst,
    amountDue: money(totalAmount + gst),
  };
}
