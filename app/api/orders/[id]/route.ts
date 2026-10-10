import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getOrderById, updateOrder } from "@/lib/db";
import { priceInvoice } from "@/lib/invoice";
import { normalizeOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum([
    "pending",
    "accepted",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

const moneyField = z.number().min(0).max(1000000);

const invoiceLineSchema = z.object({
  productId: z.string().min(1),
  description: z.string().trim().min(1).max(160),
  quantity: z.number().int().min(1).max(5000),
  unitPrice: z.number().min(0).max(10000),
  pttUnit: z.number().min(0).max(10000),
  no: z.number().int().min(1).max(999).optional(),
  totalPrice: moneyField.optional(),
  totalPtt: moneyField.optional(),
  amount: moneyField.optional(),
});

const invoiceSchema = z.object({
  invoice: z.object({
    billToName: z.string().trim().min(1).max(160),
    billToAddress: z.string().trim().min(1).max(400),
    billToPhone: z.string().trim().max(40),
    shipToName: z.string().trim().min(1).max(160),
    shipToAddress: z.string().trim().min(1).max(400),
    shipToPhone: z.string().trim().max(40),
    discountPercent: z.number().min(0).max(100),
    discountAmount: moneyField.optional(),
    subtotal: moneyField.optional(),
    ptt: moneyField.optional(),
    totalAmount: moneyField.optional(),
    gst: moneyField.optional(),
    amountDue: moneyField.optional(),
    lines: z.array(invoiceLineSchema).min(1),
  }),
});

const adminOrderSchema = z.object({
  order: z.object({
    status: z.enum([
      "pending",
      "accepted",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ]),
    province: z.string().trim().min(2).max(8),
    notes: z.string().trim().max(2000).optional(),
    discountPercent: z.number().min(0).max(100),
    discountTier: z.string().trim().max(120).optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          productName: z.string().trim().min(1).max(160),
          quantity: z.number().int().min(1).max(5000),
          unitPrice: z.number().min(0).max(10000),
        })
      )
      .min(1),
    billToName: z.string().trim().min(1).max(160),
    billToAddress: z.string().trim().max(400),
    billToPhone: z.string().trim().max(40),
    shipToName: z.string().trim().min(1).max(160),
    shipToAddress: z.string().trim().max(400),
    shipToPhone: z.string().trim().max(40),
    lines: z.array(invoiceLineSchema).min(1),
  }),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const json = await req.json();
    if (json && typeof json === "object" && "invoice" in json) {
      const body = invoiceSchema.parse(json);
      const current = await getOrderById(id);
      if (!current) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      const round = (amount: number) => Math.round((Number(amount) || 0) * 100) / 100;
      const lines = body.invoice.lines.map((line, index) => {
        const totalPrice = round(line.totalPrice ?? line.quantity * line.unitPrice);
        const totalPtt = round(line.totalPtt ?? line.quantity * line.pttUnit);
        return {
          ...line,
          no: line.no ?? index + 1,
          totalPrice,
          totalPtt,
          amount: round(line.amount ?? totalPrice + totalPtt),
        };
      });
      const items = lines.map((line) => {
        const existing = current.items.find(
          (item) => item.productId === line.productId
        );
        return {
          productId: line.productId,
          productName: existing?.productName || line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        };
      });
      const subtotal = round(
        body.invoice.subtotal ?? lines.reduce((sum, line) => sum + line.totalPrice, 0)
      );
      const discountPercent = Math.min(100, Math.max(0, body.invoice.discountPercent));
      const discountAmount = round(
        body.invoice.discountAmount ?? subtotal * (discountPercent / 100)
      );
      const ptt = round(
        body.invoice.ptt ?? lines.reduce((sum, line) => sum + line.totalPtt, 0)
      );
      const totalAmount = round(
        body.invoice.totalAmount ?? subtotal - discountAmount + ptt
      );
      const gst = round(body.invoice.gst ?? totalAmount * 0.05);
      const amountDue = round(body.invoice.amountDue ?? totalAmount + gst);
      const percentChanged = discountPercent !== (current.discountPercent || 0);
      const order = await updateOrder(id, {
        items,
        subtotal,
        discountPercent,
        discountAmount,
        discountTier: percentChanged ? "" : current.discountTier,
        total: round(subtotal - discountAmount),
        invoiceOverrides: {
          billToName: body.invoice.billToName,
          billToAddress: body.invoice.billToAddress,
          billToPhone: body.invoice.billToPhone,
          shipToName: body.invoice.shipToName,
          shipToAddress: body.invoice.shipToAddress,
          shipToPhone: body.invoice.shipToPhone,
          subtotal,
          discountAmount,
          ptt,
          totalAmount,
          gst,
          amountDue,
          lines: lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            pttUnit: line.pttUnit,
            no: line.no,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            totalPrice: line.totalPrice,
            totalPtt: line.totalPtt,
            amount: line.amount,
          })),
        },
      });
      return NextResponse.json({ ok: true, order });
    }

    if (json && typeof json === "object" && "order" in json) {
      const body = adminOrderSchema.parse(json);
      const current = await getOrderById(id);
      if (!current) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      const priced = priceInvoice(
        body.order.lines,
        body.order.discountPercent
      );
      const status = normalizeOrderStatus(body.order.status) as OrderStatus;
      const order = await updateOrder(id, {
        status,
        province: body.order.province.toUpperCase(),
        notes: body.order.notes || "",
        items: body.order.items,
        subtotal: priced.subtotal,
        discountPercent: priced.discountPercent,
        discountAmount: priced.discountAmount,
        discountTier: body.order.discountTier || "",
        total: Math.round((priced.subtotal - priced.discountAmount) * 100) / 100,
        invoiceOverrides: {
          billToName: body.order.billToName,
          billToAddress: body.order.billToAddress,
          billToPhone: body.order.billToPhone,
          shipToName: body.order.shipToName,
          shipToAddress: body.order.shipToAddress,
          shipToPhone: body.order.shipToPhone,
          lines: body.order.lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            pttUnit: line.pttUnit,
          })),
        },
      });
      return NextResponse.json({ ok: true, order });
    }

    const body = statusSchema.parse(json);
    const order = await updateOrder(id, {
      status: normalizeOrderStatus(body.status) as OrderStatus,
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, order });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
