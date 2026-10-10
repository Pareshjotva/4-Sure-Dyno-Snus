import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { dayEndIso, dayStartIso, getAnalyticsReport } from "@/lib/analytics";

function day(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

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
  const fromDay = day(url.searchParams.get("from")) || today;
  const toDay = day(url.searchParams.get("to")) || today;
  const from = dayStartIso(fromDay);
  const to = dayEndIso(toDay);
  const span = new Date(to).getTime() - new Date(from).getTime();
  const compareTo = day(url.searchParams.get("compareTo"))
    ? dayEndIso(day(url.searchParams.get("compareTo")))
    : new Date(new Date(from).getTime() - 1).toISOString();
  const compareFrom = day(url.searchParams.get("compareFrom"))
    ? dayStartIso(day(url.searchParams.get("compareFrom")))
    : new Date(new Date(compareTo).getTime() - span).toISOString();
  const report = await getAnalyticsReport(from, to, compareFrom, compareTo);
  return NextResponse.json(report);
}
