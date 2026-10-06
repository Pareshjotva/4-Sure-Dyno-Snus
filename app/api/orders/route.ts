import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  createOrder,
  getIncentives,
  getProductById,
  getSite,
} from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { orderSchema } from "@/lib/form-schemas";
import { resolveIncentive } from "@/lib/site";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await requireSession("retailer");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = orderSchema.parse(await req.json());
    const site = await getSite();
    const incentives = await getIncentives();

    const lineItems = [];
    let packCount = 0;
    for (const item of body.items) {
      const product = await getProductById(item.productId);
      if (!product || !product.active) {
        return NextResponse.json(
          {
            fieldErrors: {
              items: "One of the selected products is no longer available.",
            },
          },
          { status: 400 }
        );
      }
      packCount += item.quantity;
      lineItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: 40,
      });
    }

    if (packCount < site.minOrderPacks) {
      return NextResponse.json(
        {
          fieldErrors: {
            packs: `Minimum order is ${site.minOrderPacks} packs (50 g).`,
          },
        },
        { status: 400 }
      );
    }

    const subtotal = lineItems.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice,
      0
    );
    const tier = resolveIncentive(packCount, incentives);
    const discountPercent = tier?.discountPercent ?? 0;
    const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
    const total = Math.round((subtotal - discountAmount) * 100) / 100;

    const order = await createOrder({
      userId: session.id,
      userName: session.name,
      company: session.company,
      province: body.province,
      items: lineItems,
      subtotal,
      discountPercent,
      discountAmount,
      total,
      status: "pending",
      notes:
        body.notes ||
        (packCount >= site.minOrderPacks
          ? "Minimum order met — free shipping."
          : undefined),
    });

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { fieldErrors: zodFieldErrors(err) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Could not place the order. Try again." },
      { status: 400 }
    );
  }
}
