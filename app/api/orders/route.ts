import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  createOrder,
  getIncentives,
  getProductById,
  getSite,
} from "@/lib/db";
import { resolveIncentive } from "@/lib/site";
import { z } from "zod";

const schema = z.object({
  province: z.string().min(2),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(500),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const session = await requireSession("retailer");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const site = await getSite();
    const incentives = await getIncentives();

    const lineItems = [];
    let packCount = 0;
    for (const item of body.items) {
      const product = await getProductById(item.productId);
      if (!product || !product.active) {
        return NextResponse.json(
          { error: "Invalid product in cart." },
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
          error: `Minimum order is ${site.minOrderPacks} packs (50 g).`,
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
  } catch {
    return NextResponse.json({ error: "Could not place order." }, { status: 400 });
  }
}
