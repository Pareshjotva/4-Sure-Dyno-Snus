import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getIncentives, saveIncentives } from "@/lib/db";
import type { IncentiveTier } from "@/lib/types";
import { z } from "zod";

const tierSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  minPacks: z.number().int().min(0),
  maxPacks: z.number().int().min(0).nullable(),
  discountPercent: z.number().min(0).max(100),
  savePerPack: z.number().min(0).max(1000),
});

const bodySchema = z.object({
  tiers: z.array(tierSchema).min(1).max(12),
});

export async function GET() {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ tiers: await getIncentives() });
}

export async function PUT(req: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = bodySchema.parse(await req.json());
    const sorted = [...body.tiers].sort((a, b) => a.minPacks - b.minPacks);
    for (let i = 0; i < sorted.length; i++) {
      const tier = sorted[i];
      if (tier.maxPacks != null && tier.maxPacks < tier.minPacks) {
        return NextResponse.json(
          { error: `${tier.name}: max packs must be ≥ min packs.` },
          { status: 400 }
        );
      }
      if (i > 0 && tier.minPacks <= sorted[i - 1].minPacks) {
        return NextResponse.json(
          { error: "Each slab needs a higher minimum pack count than the previous." },
          { status: 400 }
        );
      }
    }
    const tiers = (await saveIncentives(sorted as IncentiveTier[])).sort(
      (a, b) => a.minPacks - b.minPacks
    );
    return NextResponse.json({ ok: true, tiers });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid slabs." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Could not save discount slabs." },
      { status: 400 }
    );
  }
}
