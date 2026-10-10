import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { licenseContentType, readLicenseFile, type LicenseSlot } from "@/lib/license-files";

const SLOTS = new Set<LicenseSlot>(["primary", "location2", "location3"]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string; slot: string }> }
) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, slot } = await params;
  if (!SLOTS.has(slot as LicenseSlot)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (session.role !== "admin" && session.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserById(userId);
  const license =
    slot === "primary" ? user?.license : slot === "location2" ? user?.license2 : user?.license3;
  if (!license?.storedName) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const bytes = await readLicenseFile(license.storedName);
  if (!bytes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": licenseContentType(license.storedName),
      "Content-Disposition": `inline; filename="${license.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
