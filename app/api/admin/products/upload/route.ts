import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  deleteStoredProductImage,
  productImageError,
  saveProductImage,
} from "@/lib/product-upload";

export async function POST(req: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const publicPath = await saveProductImage(
      file,
      `new-${field}-${Date.now()}`
    );
    return NextResponse.json({ ok: true, path: publicPath });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pathName = new URL(req.url).searchParams.get("path") || "";
  await deleteStoredProductImage(pathName);
  return NextResponse.json({ ok: true });
}
