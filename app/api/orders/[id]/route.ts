import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { updateOrder } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";
import { z } from "zod";

const schema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
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
    const body = schema.parse(await req.json());
    const order = await updateOrder(id, { status: body.status as OrderStatus });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, order });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
