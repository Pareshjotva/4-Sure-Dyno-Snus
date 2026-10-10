import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { monthlyAnalyticsCsv } from "@/lib/analytics";

export async function GET(req: Request) {
  const session = await requireSession("admin");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const month = new URL(req.url).searchParams.get("month") || "";
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Choose a month as YYYY-MM." }, { status: 400 });
  }
  const csv = await monthlyAnalyticsCsv(month);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analytics-${month}.csv"`,
    },
  });
}
