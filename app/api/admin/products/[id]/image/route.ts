import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getProductById, updateProduct } from "@/lib/db";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

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
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, or GIF allowed." },
        { status: 400 }
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Max file size is 5MB." },
        { status: 400 }
      );
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
    const filename = `${id}-${field}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
    const publicPath = `/uploads/products/${filename}`;

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
  if (current?.startsWith("/uploads/products/")) {
    const filePath = path.join(process.cwd(), "public", current);
    await fs.unlink(filePath).catch(() => undefined);
  }

  const fallback =
    field === "image" ? "/images/dyno-extreme.jpg" : "/images/extreme-overview.jpg";
  const updated = await updateProduct(id, { [field]: fallback });
  return NextResponse.json({ ok: true, product: updated });
}
