import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { markAdminNoticeRead } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await markAdminNoticeRead(id);
  return NextResponse.json({ ok: true });
}
