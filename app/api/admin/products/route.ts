import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createProduct } from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { productSchema } from "@/lib/form-schemas";
import { z } from "zod";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function POST(req: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = productSchema.parse(await req.json());
    const slug = body.slug?.trim() || slugify(body.name);
    const product = await createProduct({
      slug,
      name: body.name,
      shortName: body.shortName || body.name,
      tagline: body.tagline,
      description: body.description,
      flavour: body.flavour || "Signature blend",
      nicotinePerPortionMg: body.nicotinePerPortionMg,
      nicotinePerGramMg: body.nicotinePerGramMg,
      pouchesPerPack: body.pouchesPerPack || "Approx. 73–75 slim pouches",
      packSize: body.packSize || "50 g resealable soft pack",
      format: body.format || "Slim pouch",
      origin: body.origin || "Produced in Norway",
      features: ["Soft mesh pouch technology", "Canadian plain packaging"],
      image: body.image || "/images/dyno-extreme.jpg",
      overviewImage: body.overviewImage || body.image || "/images/extreme-overview.jpg",
      active: body.active ?? true,
    });
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
      { error: "Unable to create the product. Try again." },
      { status: 400 }
    );
  }
}
