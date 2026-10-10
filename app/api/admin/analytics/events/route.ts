import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dayEndIso, dayStartIso, listAnalyticsEvents } from "@/lib/analytics";

export async function GET(req: Request) {
  const session = await requireSession("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const from = url.searchParams.get("from") || today;
  const to = url.searchParams.get("to") || today;
  const page = Number(url.searchParams.get("page") || 0);
  const result = await listAnalyticsEvents({
    from: dayStartIso(from),
    to: dayEndIso(to),
    type: url.searchParams.get("type") || "",
    path: url.searchParams.get("path") || "",
    country: url.searchParams.get("country") || "",
    device: url.searchParams.get("device") || "",
    sessionId: url.searchParams.get("session") || "",
    page: Number.isFinite(page) && page > 0 ? page : 0,
  });
  return NextResponse.json(result);
}
