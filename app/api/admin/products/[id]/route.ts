import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { deleteProduct, updateProduct } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).optional(),
  shortName: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  tagline: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  flavour: z.string().optional(),
  nicotinePerPortionMg: z.number().optional(),
  nicotinePerGramMg: z.number().optional(),
  pouchesPerPack: z.string().optional(),
  packSize: z.string().optional(),
  format: z.string().optional(),
  origin: z.string().optional(),
  tobaccoFreePercent: z.number().nullable().optional(),
  features: z.array(z.string()).optional(),
  image: z.string().optional(),
  overviewImage: z.string().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().optional(),
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
    const patch = {
      ...body,
      tobaccoFreePercent:
        body.tobaccoFreePercent === null
          ? undefined
          : body.tobaccoFreePercent,
    };
    const product = await updateProduct(id, patch);
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteProduct(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
