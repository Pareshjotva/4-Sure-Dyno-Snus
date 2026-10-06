import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getProductById, updateProduct } from "@/lib/db";
import {
  deleteStoredProductImage,
  productImageError,
  saveProductImage,
} from "@/lib/product-upload";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const form = await req.formData();
    const field = String(form.get("field") || "image");
    if (field !== "image" && field !== "overviewImage") {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const invalid = productImageError(file);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    const publicPath = await saveProductImage(file, `${id}-${field}-${Date.now()}`);

    const updated = await updateProduct(id, { [field]: publicPath });
    return NextResponse.json({ ok: true, product: updated, path: publicPath });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const field = searchParams.get("field") || "image";
  if (field !== "image" && field !== "overviewImage") {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  const current = product[field as "image" | "overviewImage"];
  if (current) await deleteStoredProductImage(current);

  const fallback =
    field === "image" ? "/images/dyno-extreme.jpg" : "/images/extreme-overview.jpg";
  const updated = await updateProduct(id, { [field]: fallback });
  return NextResponse.json({ ok: true, product: updated });
}
