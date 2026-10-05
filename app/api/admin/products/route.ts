import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createProduct } from "@/lib/db";
import { z } from "zod";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

const schema = z.object({
  name: z.string().min(2),
  shortName: z.string().min(2).optional(),
  tagline: z.string().min(2),
  description: z.string().min(10),
  flavour: z.string().min(2).optional(),
  nicotinePerPortionMg: z.number().nonnegative(),
  nicotinePerGramMg: z.number().nonnegative(),
  pouchesPerPack: z.string().optional(),
  packSize: z.string().optional(),
  format: z.string().optional(),
  origin: z.string().optional(),
  tobaccoFreePercent: z.number().optional(),
  features: z.array(z.string()).optional(),
  image: z.string().optional(),
  overviewImage: z.string().optional(),
  active: z.boolean().optional(),
  slug: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = schema.parse(await req.json());
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
      tobaccoFreePercent: body.tobaccoFreePercent,
      features: body.features?.length
        ? body.features
        : ["Soft mesh pouch technology", "Canadian plain packaging"],
      image: body.image || "/images/dyno-extreme.jpg",
      overviewImage: body.overviewImage || body.image || "/images/extreme-overview.jpg",
      active: body.active ?? true,
    });
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to create product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
