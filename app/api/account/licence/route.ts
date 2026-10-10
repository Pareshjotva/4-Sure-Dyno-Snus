import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";

export async function POST() {
  const session = await requireSession("retailer");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Upload your tobacco license from your profile, including its expiry date." },
    { status: 400 }
  );
}
