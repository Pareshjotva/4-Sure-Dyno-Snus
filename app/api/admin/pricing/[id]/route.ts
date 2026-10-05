import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { updatePricing } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  wholesale: z.number().positive().optional(),
  ptt: z.number().nonnegative().optional(),
  msrpMin: z.number().positive().optional(),
  msrpMax: z.number().positive().optional(),
  marginMin: z.number().optional(),
  marginMax: z.number().optional(),
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
    const row = await updatePricing(id, body);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, pricing: row });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
