import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { deleteProduct, updateProduct } from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { productSchema } from "@/lib/form-schemas";
import { z } from "zod";

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
    const body = productSchema.parse(await req.json());
    const { slug, ...rest } = body;
    const product = await updateProduct(id, {
      ...rest,
      ...(slug ? { slug } : {}),
    });
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { fieldErrors: zodFieldErrors(err) },
        { status: 400 }
      );
    }
    if (err instanceof Error && err.message === "Slug already exists") {
      return NextResponse.json(
        { fieldErrors: { slug: "That slug is already used. Choose another." } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Unable to update the product. Try again." },
      { status: 400 }
    );
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
