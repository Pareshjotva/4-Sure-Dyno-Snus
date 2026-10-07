import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  createOrder,
  getIncentives,
  getOrders,
  getProductById,
  getSite,
  getUserById,
  updateUser,
} from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { licenceNumberSchema, orderSchema } from "@/lib/form-schemas";
import { packsThisMonth, quoteVolumeDiscount } from "@/lib/site";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await requireSession("retailer");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = orderSchema.parse(await req.json());
    const user = await getUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let licenceToSave = "";
    if (!user.licenceNumber?.trim()) {
      const licence = licenceNumberSchema.safeParse(body.licenceNumber || "");
      if (!licence.success) {
        return NextResponse.json(
          {
            fieldErrors: {
              licenceNumber:
                licence.error.issues[0]?.message ||
                "Enter the tobacco licence number.",
            },
          },
          { status: 400 }
        );
      }
      licenceToSave = licence.data;
    }
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
    const priorOrders = await getOrders(session.id);
    const monthPacksBefore = packsThisMonth(priorOrders);
    const quote = quoteVolumeDiscount(
      packCount,
      monthPacksBefore,
      incentives,
      subtotal
    );

    if (licenceToSave) {
      await updateUser(session.id, { licenceNumber: licenceToSave });
    }

    const order = await createOrder({
      userId: session.id,
      userName: session.name,
      company: session.company,
      province: body.province,
      items: lineItems,
      subtotal,
      discountPercent: quote.discountPercent,
      discountAmount: quote.discountAmount,
      discountTier: quote.tier?.name || "",
      monthPacksBefore,
      qualifyingPacks: quote.qualifyingPacks,
      total: quote.total,
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
