import {
  ANALYTICS_EVENTS,
  type AnalyticsEventType,
  type AnalyticsMetrics,
  type AnalyticsReport,
  type AnalyticsSource,
} from "@/lib/analytics-shared";
import { getDb } from "@/lib/mongo";

export { ANALYTICS_EVENTS, ANALYTICS_SOURCES } from "@/lib/analytics-shared";
export type {
  AnalyticsEventType,
  AnalyticsMetrics,
  AnalyticsReport,
  AnalyticsSource,
} from "@/lib/analytics-shared";

interface SessionDoc {
  id: string;
  visitorId: string;
  startedAt: string;
  lastSeenAt: string;
  landingPath: string;
  exitPath: string;
  referrer: string;
  source: AnalyticsSource;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  browser: string;
  os: string;
  device: string;
  country: string;
  region: string;
  city: string;
  pageViews: number;
  engagedMs: number;
  isNewVisitor: boolean;
}

interface EventDoc {
  id: string;
  sessionId: string;
  visitorId: string;
  type: AnalyticsEventType;
  name: string;
  path: string;
  title: string;
  referrer: string;
  ts: string;
  engagementMs: number;
  scrollDepth: number;
  metadata: Record<string, string>;
}

const BLOCKED_META = /password|email|phone|token|secret|licence|license|address|card|name/i;

let indexesReady: Promise<void> | null = null;
let lastCleanup = 0;
const geoCache = new Map<string, { country: string; region: string; city: string }>();

function retentionDays() {
  const days = Number(process.env.ANALYTICS_RETENTION_DAYS || 180);
  return Number.isFinite(days) && days >= 7 ? days : 180;
}

export function edmontonOffset(date: Date) {
  const zone = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Edmonton",
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = zone?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return "-07:00";
  return `${match[1]}${match[2].padStart(2, "0")}:${match[3] || "00"}`;
}

export function dayStartIso(day: string) {
  return new Date(`${day}T00:00:00${edmontonOffset(new Date(`${day}T12:00:00Z`))}`).toISOString();
}

export function dayEndIso(day: string) {
  return new Date(`${day}T23:59:59.999${edmontonOffset(new Date(`${day}T12:00:00Z`))}`).toISOString();
}

export function classifySource(referrer: string, utm: Record<string, string>) {
  const medium = (utm.medium || "").toLowerCase();
  if (["cpc", "ppc", "paid", "paidsocial", "display"].includes(medium)) return "paid" as const;
  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "";
  } catch {
    host = "";
  }
  if (!host) return "direct" as const;
  if (host.includes("google.")) return "google" as const;
  if (host.includes("bing.") || host.includes("yahoo.")) return "bing" as const;
  if (
    /(facebook|instagram|t\.co|twitter|x\.com|linkedin|tiktok|youtube|reddit|pinterest)\./.test(
      host
    )
  ) {
    return "social" as const;
  }
  return "referral" as const;
}

export function parseUserAgent(ua: string) {
  const agent = ua || "";
  const device = /ipad|tablet/i.test(agent)
    ? "tablet"
    : /mobile|iphone|android/i.test(agent)
      ? "mobile"
      : "desktop";
  const browser = /edg\//i.test(agent)
    ? "Edge"
    : /chrome|crios/i.test(agent)
      ? "Chrome"
      : /firefox|fxios/i.test(agent)
        ? "Firefox"
        : /safari/i.test(agent)
          ? "Safari"
          : "Other";
  const os = /windows/i.test(agent)
    ? "Windows"
    : /android/i.test(agent)
      ? "Android"
      : /iphone|ipad|ios/i.test(agent)
        ? "iOS"
        : /mac os/i.test(agent)
          ? "macOS"
          : /linux/i.test(agent)
            ? "Linux"
            : "Other";
  return { device, browser, os };
}

function safeMeta(input: unknown) {
  const metadata: Record<string, string> = {};
  if (!input || typeof input !== "object") return metadata;
  for (const [key, value] of Object.entries(input).slice(0, 8)) {
    if (BLOCKED_META.test(key)) continue;
    if (typeof value === "string") metadata[key.slice(0, 40)] = value.slice(0, 80);
    else if (typeof value === "number" && Number.isFinite(value)) {
      metadata[key.slice(0, 40)] = String(value).slice(0, 80);
    } else if (typeof value === "boolean") metadata[key.slice(0, 40)] = value ? "true" : "false";
  }
  return metadata;
}

function cleanReferrer(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.slice(0, 300);
  } catch {
    return "";
  }
}

async function collections() {
  const db = await getDb();
  return {
    events: db.collection<EventDoc>("analyticsEvents"),
    sessions: db.collection<SessionDoc>("analyticsSessions"),
    visitors: db.collection<{ id: string; firstSeenAt: string; lastSeenAt: string }>(
      "analyticsVisitors"
    ),
  };
}

export function ensureAnalyticsIndexes() {
  if (!indexesReady) {
    indexesReady = (async () => {
      const { events, sessions, visitors } = await collections();
      await Promise.all([
        events.createIndex({ id: 1 }, { unique: true }),
        events.createIndex({ ts: -1 }),
        events.createIndex({ sessionId: 1, ts: 1 }),
        events.createIndex({ type: 1, ts: -1 }),
        events.createIndex({ path: 1, ts: -1 }),
        sessions.createIndex({ id: 1 }, { unique: true }),
        sessions.createIndex({ startedAt: -1 }),
        sessions.createIndex({ lastSeenAt: -1 }),
        sessions.createIndex({ visitorId: 1, startedAt: -1 }),
        visitors.createIndex({ id: 1 }, { unique: true }),
      ]);
    })().catch((error) => {
      indexesReady = null;
      throw error;
    });
  }
  return indexesReady;
}

async function locate(ip: string) {
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.")
  ) {
    return { country: "Local network", region: "", city: "Approximate" };
  }
  const cached = geoCache.get(ip);
  if (cached) return cached;
  const unknown = { country: "Unknown", region: "", city: "" };
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(2500),
    });
    const data = (await response.json()) as {
      success?: boolean;
      country?: string;
      region?: string;
      city?: string;
    };
    const place =
      data.success === false
        ? unknown
        : {
            country: (data.country || "Unknown").slice(0, 80),
            region: (data.region || "").slice(0, 80),
            city: (data.city || "").slice(0, 80),
          };
    geoCache.set(ip, place);
    return place;
  } catch {
    return unknown;
  }
}

async function maybeCleanup() {
  if (Date.now() - lastCleanup < 60 * 60 * 1000) return;
  lastCleanup = Date.now();
  const cutoff = new Date(Date.now() - retentionDays() * 86400000).toISOString();
  const { events, sessions } = await collections();
  await events.deleteMany({ ts: { $lt: cutoff } });
  await sessions.deleteMany({ lastSeenAt: { $lt: cutoff } });
}

export async function recordAnalyticsEvent(input: {
  id: string;
  sessionId: string;
  visitorId: string;
  type: AnalyticsEventType;
  name: string;
  path: string;
  title: string;
  referrer: string;
  ts: string;
  engagementMs: number;
  scrollDepth: number;
  metadata: unknown;
  utm: Record<string, string>;
  userAgent: string;
  ip: string;
}) {
  await ensureAnalyticsIndexes();
  const { events, sessions, visitors } = await collections();
  const ts = Number.isNaN(Date.parse(input.ts)) ? new Date().toISOString() : new Date(input.ts).toISOString();
  try {
    await events.insertOne({
      id: input.id,
      sessionId: input.sessionId,
      visitorId: input.visitorId,
      type: input.type,
      name: input.name.slice(0, 120),
      path: input.path.slice(0, 200),
      title: input.title.slice(0, 150),
      referrer: cleanReferrer(input.referrer),
      ts,
      engagementMs: Math.max(0, input.engagementMs),
      scrollDepth: Math.min(100, Math.max(0, input.scrollDepth)),
      metadata: safeMeta(input.metadata),
    });
  } catch (error) {
    if (isDuplicate(error)) return { duplicate: true };
    throw error;
  }

  const nowVisitor = await visitors.findOne({ id: input.visitorId });
  const isNewVisitor = !nowVisitor;
  if (isNewVisitor) {
    try {
      await visitors.insertOne({ id: input.visitorId, firstSeenAt: ts, lastSeenAt: ts });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      await visitors.updateOne({ id: input.visitorId }, { $set: { lastSeenAt: ts } });
    }
  } else {
    await visitors.updateOne({ id: input.visitorId }, { $set: { lastSeenAt: ts } });
  }

  const agent = parseUserAgent(input.userAgent);
  const source = classifySource(input.referrer, input.utm);
  const place = await locate(input.ip);
  const referrer = cleanReferrer(input.referrer);
  const existingSession = await sessions.findOne({ id: input.sessionId });
  if (!existingSession) {
    try {
      await sessions.insertOne({
        id: input.sessionId,
        visitorId: input.visitorId,
        startedAt: ts,
        lastSeenAt: ts,
        landingPath: input.path,
        exitPath: input.path,
        referrer,
        source,
        utmSource: input.utm.source || "",
        utmMedium: input.utm.medium || "",
        utmCampaign: input.utm.campaign || "",
        utmTerm: input.utm.term || "",
        utmContent: input.utm.content || "",
        browser: agent.browser,
        os: agent.os,
        device: agent.device,
        country: place.country,
        region: place.region,
        city: place.city,
        pageViews: input.type === "pageview" ? 1 : 0,
        engagedMs: Math.max(0, input.engagementMs),
        isNewVisitor,
      });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      await sessions.updateOne(
        { id: input.sessionId },
        {
          $set: {
            lastSeenAt: ts,
            ...(input.type === "pageview" && input.path ? { exitPath: input.path } : {}),
          },
          $inc: {
            pageViews: input.type === "pageview" ? 1 : 0,
            engagedMs: Math.max(0, input.engagementMs),
          },
        }
      );
    }
  } else {
    await sessions.updateOne(
      { id: input.sessionId },
      {
        $set: {
          lastSeenAt: ts,
          ...(input.type === "pageview" && input.path ? { exitPath: input.path } : {}),
        },
        $inc: {
          pageViews: input.type === "pageview" ? 1 : 0,
          engagedMs: Math.max(0, input.engagementMs),
        },
      }
    );
  }

  void maybeCleanup();
  return { duplicate: false };
}

function isDuplicate(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function emptyMetrics(): AnalyticsMetrics {
  return {
    users: 0,
    sessions: 0,
    pageViews: 0,
    newVisitors: 0,
    returningVisitors: 0,
    avgEngagementMs: 0,
    bounceRate: 0,
    pagesPerSession: 0,
  };
}

function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

async function metricsFor(from: string, to: string) {
  const { events, sessions, visitors } = await collections();
  const started = await sessions
    .find({ startedAt: { $gte: from, $lte: to } })
    .limit(8000)
    .toArray();
  const pageEvents = await events
    .find({ ts: { $gte: from, $lte: to }, type: { $in: ["pageview", "engagement", "scroll"] } })
    .limit(20000)
    .toArray();
  const truncated = started.length >= 8000 || pageEvents.length >= 20000;
  const visitorIds = [...new Set(started.map((session) => session.visitorId))];
  const visitorDocs = visitorIds.length
    ? await visitors.find({ id: { $in: visitorIds } }).toArray()
    : [];
  const firstSeen = new Map(visitorDocs.map((visitor) => [visitor.id, visitor.firstSeenAt]));
  const newIds = new Set(
    visitorIds.filter((id) => {
      const seen = firstSeen.get(id);
      return !seen || (seen >= from && seen <= to);
    })
  );
  const pageViews = started.reduce((sum, session) => sum + session.pageViews, 0);
  const engaged = started.reduce((sum, session) => sum + session.engagedMs, 0);
  const bounces = started.filter((session) => session.pageViews <= 1).length;
  const summary: AnalyticsMetrics = {
    users: visitorIds.length,
    sessions: started.length,
    pageViews,
    newVisitors: newIds.size,
    returningVisitors: Math.max(0, visitorIds.length - newIds.size),
    avgEngagementMs: started.length ? Math.round(engaged / started.length) : 0,
    bounceRate: started.length ? bounces / started.length : 0,
    pagesPerSession: started.length ? Math.round((pageViews / started.length) * 10) / 10 : 0,
  };
  return { started, pageEvents, summary, truncated };
}

function pageKey(path: string) {
  const bare = (path.split("?")[0] || "/").trim() || "/";
  return bare.length > 1 && bare.endsWith("/") ? bare.slice(0, -1) : bare;
}

function countBy<T>(rows: T[], key: (row: T) => string) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const name = key(row) || "Unknown";
    map.set(name, (map.get(name) || 0) + 1);
  }
  return [...map.entries()]
    .map(([name, sessions]) => ({ name, sessions }))
    .sort((a, b) => b.sessions - a.sessions);
}

export async function getAnalyticsReport(from: string, to: string, compareFrom: string, compareTo: string) {
  await ensureAnalyticsIndexes();
  const current = await metricsFor(from, to);
  const previous = await metricsFor(compareFrom, compareTo);
  const { sessions } = await collections();
  const activeSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const activeVisitors = (await sessions.distinct("visitorId", { lastSeenAt: { $gte: activeSince } })).length;

  const seriesMap = new Map<string, { pageViews: number; sessions: number }>();
  for (const session of current.started) {
    const key = dayKey(session.startedAt);
    const row = seriesMap.get(key) || { pageViews: 0, sessions: 0 };
    row.sessions += 1;
    row.pageViews += session.pageViews;
    seriesMap.set(key, row);
  }
  const series = [...seriesMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, row]) => ({ date, ...row }));

  const placeMap = new Map<string, Set<string>>();
  for (const session of current.started) {
    const key = `${session.country}|${session.city}`;
    const users = placeMap.get(key) || new Set<string>();
    if (session.visitorId) users.add(session.visitorId);
    placeMap.set(key, users);
  }
  const countries = [...placeMap.entries()]
    .map(([key, users]) => {
      const [country, city] = key.split("|");
      return { country, city, users: users.size };
    })
    .sort((a, b) => b.users - a.users)
    .slice(0, 40);

  const pageViews = current.pageEvents.filter((event) => event.type === "pageview");
  const engagement = current.pageEvents.filter((event) => event.type === "engagement");
  const pageMap = new Map<string, { views: number; users: Set<string>; engaged: number; engagedCount: number }>();
  for (const event of pageViews) {
    const path = pageKey(event.path);
    const row = pageMap.get(path) || { views: 0, users: new Set<string>(), engaged: 0, engagedCount: 0 };
    row.views += 1;
    if (event.visitorId) row.users.add(event.visitorId);
    pageMap.set(path, row);
  }
  for (const event of engagement) {
    const path = pageKey(event.path);
    const row = pageMap.get(path) || { views: 0, users: new Set<string>(), engaged: 0, engagedCount: 0 };
    row.engaged += event.engagementMs;
    row.engagedCount += 1;
    pageMap.set(path, row);
  }
  const topPages = [...pageMap.entries()]
    .map(([path, row]) => ({
      path,
      views: row.views,
      users: row.users.size,
      avgEngagementMs: row.engagedCount ? Math.round(row.engaged / row.engagedCount) : 0,
    }))
    .sort((a, b) => b.users - a.users || b.views - a.views)
    .slice(0, 40);

  const landingMap = new Map<string, number>();
  const exitMap = new Map<string, { sessions: number; bounces: number }>();
  for (const session of current.started) {
    landingMap.set(session.landingPath, (landingMap.get(session.landingPath) || 0) + 1);
    const exit = exitMap.get(session.exitPath) || { sessions: 0, bounces: 0 };
    exit.sessions += 1;
    if (session.pageViews <= 1) exit.bounces += 1;
    exitMap.set(session.exitPath, exit);
  }

  const eventCountsMap = new Map<string, number>();
  const counted = await (await collections()).events
    .find({ ts: { $gte: from, $lte: to } })
    .project({ type: 1 })
    .limit(20000)
    .toArray();
  for (const event of counted) {
    eventCountsMap.set(event.type, (eventCountsMap.get(event.type) || 0) + 1);
  }

  const recent = [...current.started].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 20);
  const recentIds = recent.map((session) => session.id);
  const journeyEvents = recentIds.length
    ? await (await collections()).events
        .find({ sessionId: { $in: recentIds }, type: "pageview" })
        .sort({ ts: 1 })
        .toArray()
    : [];
  const pagesBySession = new Map<string, { path: string; title: string; ts: string }[]>();
  for (const event of journeyEvents) {
    const list = pagesBySession.get(event.sessionId) || [];
    list.push({ path: event.path, title: event.title, ts: event.ts });
    pagesBySession.set(event.sessionId, list);
  }

  const report: AnalyticsReport = {
    from,
    to,
    compareFrom,
    compareTo,
    activeVisitors,
    truncated: current.truncated || previous.truncated,
    summary: current.summary,
    previous: previous.summary,
    series,
    countries,
    sources: countBy(current.started, (session) => session.source).map((row) => ({
      source: row.name,
      sessions: row.sessions,
    })),
    devices: countBy(current.started, (session) => session.device),
    browsers: countBy(current.started, (session) => session.browser),
    operatingSystems: countBy(current.started, (session) => session.os),
    topPages,
    landingPages: [...landingMap.entries()]
      .map(([path, count]) => ({ path, sessions: count }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10),
    exitPages: [...exitMap.entries()]
      .map(([path, row]) => ({ path, ...row }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10),
    eventCounts: [...eventCountsMap.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    journeys: recent.map((session) => ({
      sessionId: session.id,
      startedAt: session.startedAt,
      lastSeenAt: session.lastSeenAt,
      landingPath: session.landingPath,
      exitPath: session.exitPath,
      country: session.country,
      city: session.city,
      device: session.device,
      source: session.source,
      pages: pagesBySession.get(session.id) || [],
    })),
  };
  return report;
}

export async function listAnalyticsEvents(filters: {
  from: string;
  to: string;
  type?: string;
  path?: string;
  country?: string;
  device?: string;
  sessionId?: string;
  page: number;
}) {
  await ensureAnalyticsIndexes();
  const { events, sessions } = await collections();
  const query: Record<string, unknown> = { ts: { $gte: filters.from, $lte: filters.to } };
  if (filters.type) query.type = filters.type;
  if (filters.path) query.path = filters.path;
  if (filters.sessionId) query.sessionId = filters.sessionId;
  if (filters.country || filters.device) {
    const sessionQuery: Record<string, unknown> = {};
    if (filters.country) sessionQuery.country = filters.country;
    if (filters.device) sessionQuery.device = filters.device;
    const ids = await sessions.find(sessionQuery).project({ id: 1 }).limit(5000).toArray();
    query.sessionId = filters.sessionId
      ? filters.sessionId
      : { $in: ids.map((session) => session.id) };
  }
  const pageSize = 25;
  const total = await events.countDocuments(query);
  const rows = await events
    .find(query)
    .sort({ ts: -1 })
    .skip(Math.max(0, filters.page) * pageSize)
    .limit(pageSize)
    .toArray();
  const sessionIds = [...new Set(rows.map((row) => row.sessionId))];
  const sessionDocs = sessionIds.length
    ? await sessions.find({ id: { $in: sessionIds } }).toArray()
    : [];
  const byId = new Map(sessionDocs.map((session) => [session.id, session]));
  return {
    total,
    page: filters.page,
    pageSize,
    rows: rows.map((row) => {
      const session = byId.get(row.sessionId);
      return {
        id: row.id,
        sessionId: row.sessionId,
        type: row.type,
        name: row.name,
        path: row.path,
        title: row.title,
        ts: row.ts,
        scrollDepth: row.scrollDepth,
        metadata: row.metadata,
        country: session?.country || "",
        device: session?.device || "",
      };
    }),
  };
}

export async function monthlyAnalyticsCsv(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const fromDay = `${month}-01`;
  const last = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const toDay = `${month}-${String(last).padStart(2, "0")}`;
  const prevMonthDate = new Date(Date.UTC(year, mon - 2, 1));
  const prevMonth = `${prevMonthDate.getUTCFullYear()}-${String(prevMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;
  const prevLast = new Date(Date.UTC(year, mon - 1, 0)).getUTCDate();
  const report = await getAnalyticsReport(
    dayStartIso(fromDay),
    dayEndIso(toDay),
    dayStartIso(`${prevMonth}-01`),
    dayEndIso(`${prevMonth}-${String(prevLast).padStart(2, "0")}`)
  );
  const lines = [
    ["section", "name", "current", "previous"].join(","),
    csvRow("summary", "users", report.summary.users, report.previous.users),
    csvRow("summary", "sessions", report.summary.sessions, report.previous.sessions),
    csvRow("summary", "page_views", report.summary.pageViews, report.previous.pageViews),
    csvRow("summary", "new_visitors", report.summary.newVisitors, report.previous.newVisitors),
    csvRow("summary", "returning_visitors", report.summary.returningVisitors, report.previous.returningVisitors),
    csvRow("summary", "avg_engagement_seconds", Math.round(report.summary.avgEngagementMs / 1000), Math.round(report.previous.avgEngagementMs / 1000)),
    csvRow("summary", "bounce_rate", Math.round(report.summary.bounceRate * 100), Math.round(report.previous.bounceRate * 100)),
    csvRow("summary", "pages_per_session", report.summary.pagesPerSession, report.previous.pagesPerSession),
    ...report.topPages.map((row) => csvRow("top_page", row.path, row.views, "")),
    ...report.landingPages.map((row) => csvRow("landing_page", row.path, row.sessions, "")),
    ...report.exitPages.map((row) => csvRow("estimated_exit", row.path, row.sessions, row.bounces)),
    ...report.countries.map((row) => csvRow("location", `${row.country} / ${row.city}`, row.users, "")),
    ...report.sources.map((row) => csvRow("source", row.source, row.sessions, "")),
    ...report.devices.map((row) => csvRow("device", row.name, row.sessions, "")),
    ...report.browsers.map((row) => csvRow("browser", row.name, row.sessions, "")),
    ...report.eventCounts.map((row) => csvRow("event", row.type, row.count, "")),
  ];
  return lines.join("\n");
}

function csvRow(section: string, name: string, current: string | number, previous: string | number) {
  return [section, `"${String(name).replaceAll('"', '""')}"`, current, previous].join(",");
}
