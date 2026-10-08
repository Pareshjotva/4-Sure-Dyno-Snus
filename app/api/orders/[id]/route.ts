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

const invoiceLineSchema = z.object({
  productId: z.string().min(1),
  description: z.string().trim().min(1).max(160),
  quantity: z.number().int().min(1).max(5000),
  unitPrice: z.number().min(0).max(10000),
  pttUnit: z.number().min(0).max(10000),
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
      const items = body.invoice.lines.map((line) => {
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
      const priced = priceInvoice(body.invoice.lines, body.invoice.discountPercent);
      const percentChanged =
        priced.discountPercent !== (current.discountPercent || 0);
      const order = await updateOrder(id, {
        items,
        subtotal: priced.subtotal,
        discountPercent: priced.discountPercent,
        discountAmount: priced.discountAmount,
        discountTier: percentChanged ? "" : current.discountTier,
        total: Math.round((priced.subtotal - priced.discountAmount) * 100) / 100,
        invoiceOverrides: {
          billToName: body.invoice.billToName,
          billToAddress: body.invoice.billToAddress,
          billToPhone: body.invoice.billToPhone,
          shipToName: body.invoice.shipToName,
          shipToAddress: body.invoice.shipToAddress,
          shipToPhone: body.invoice.shipToPhone,
          lines: body.invoice.lines.map((line) => ({
            productId: line.productId,
            description: line.description,
            pttUnit: line.pttUnit,
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
