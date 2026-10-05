import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { updateLead } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["new", "contacted", "closed"]),
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
    const lead = await updateLead(id, body);
    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, lead });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
