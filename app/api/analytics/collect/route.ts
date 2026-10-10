import { ANALYTICS_EVENTS, recordAnalyticsEvent, type AnalyticsEventType } from "@/lib/analytics";
import { NextResponse } from "next/server";
import { z } from "zod";

const buckets = new Map<string, { count: number; reset: number }>();

const payloadSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/),
  sessionId: z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/),
  visitorId: z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/),
  type: z.enum(ANALYTICS_EVENTS),
  name: z.string().max(120).optional(),
  path: z.string().min(1).max(200),
  title: z.string().max(150).optional(),
  referrer: z.string().max(500).optional(),
  ts: z.string().max(40).optional(),
  engagementMs: z.number().min(0).max(30 * 60 * 1000).optional(),
  scrollDepth: z.number().min(0).max(100).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  utm: z
    .object({
      source: z.string().max(80).optional(),
      medium: z.string().max(80).optional(),
      campaign: z.string().max(80).optional(),
      term: z.string().max(80).optional(),
      content: z.string().max(80).optional(),
    })
    .optional(),
  consent: z.literal(true),
});

function allowedRequest(req: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const allowed = new Set(["localhost", "127.0.0.1"]);
  const host = req.headers.get("host");
  if (host) allowed.add(host.split(":")[0]);
  if (site) {
    try {
      allowed.add(new URL(site).hostname);
    } catch {
      /* ignore invalid site url */
    }
  }
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") === "same-origin";
  try {
    return allowed.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "";
  return req.headers.get("x-real-ip") || "";
}

function allowRate(key: string) {
  const now = Date.now();
  const row = buckets.get(key);
  if (!row || row.reset < now) {
    buckets.set(key, { count: 1, reset: now + 60_000 });
    return true;
  }
  row.count += 1;
  return row.count <= 90;
}

export async function POST(req: Request) {
  if (!allowedRequest(req)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
  const ip = clientIp(req);
  if (!allowRate(ip || "unknown")) {
    return NextResponse.json({ error: "Too many analytics events" }, { status: 429 });
  }
  let json: unknown;
  try {
    json = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ error: "Invalid analytics payload" }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid analytics payload" }, { status: 400 });
  }
  const data = parsed.data;
  if (!data.path.startsWith("/") || data.path.startsWith("/admin") || data.path.startsWith("/api")) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  await recordAnalyticsEvent({
    id: data.id,
    sessionId: data.sessionId,
    visitorId: data.visitorId,
    type: data.type as AnalyticsEventType,
    name: data.name || data.type,
    path: data.path,
    title: data.title || "",
    referrer: data.referrer || "",
    ts: data.ts || new Date().toISOString(),
    engagementMs: data.engagementMs || 0,
    scrollDepth: data.scrollDepth || 0,
    metadata: data.metadata,
    utm: {
      source: data.utm?.source || "",
      medium: data.utm?.medium || "",
      campaign: data.utm?.campaign || "",
      term: data.utm?.term || "",
      content: data.utm?.content || "",
    },
    userAgent: req.headers.get("user-agent") || "",
    ip,
  });
  return NextResponse.json({ ok: true });
}
