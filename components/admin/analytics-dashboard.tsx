"use client";

import { VisitorMap } from "@/components/admin/visitor-map";
import { ANALYTICS_EVENTS, type AnalyticsReport } from "@/lib/analytics-shared";
import { formatDate } from "@/lib/utils";
import { FormEvent, useEffect, useState } from "react";

type Tab = "overview" | "locations" | "journeys" | "events" | "monthly";
type EventRow = {
  id: string;
  sessionId: string;
  type: string;
  name: string;
  path: string;
  title: string;
  ts: string;
  scrollDepth: number;
  country: string;
  device: string;
};

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftDays(day: string, days: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function monthBounds(month: string) {
  const [year, mon] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const prev = new Date(Date.UTC(year, mon - 2, 1));
  const prevKey = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
  const prevLast = new Date(Date.UTC(year, mon - 1, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(last).padStart(2, "0")}`,
    compareFrom: `${prevKey}-01`,
    compareTo: `${prevKey}-${String(prevLast).padStart(2, "0")}`,
  };
}

function duration(ms: number) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function change(current: number, previous: number) {
  if (previous === 0) return current === 0 ? "0%" : "New";
  const value = Math.round(((current - previous) / previous) * 100);
  return `${value > 0 ? "+" : ""}${value}%`;
}

export function AnalyticsDashboard() {
  const today = todayKey();
  const [tab, setTab] = useState<Tab>("overview");
  const [from, setFrom] = useState(shiftDays(today, -6));
  const [to, setTo] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventTotal, setEventTotal] = useState(0);
  const [eventPage, setEventPage] = useState(0);
  const [eventType, setEventType] = useState("");
  const [eventPath, setEventPath] = useState("");
  const [eventCountry, setEventCountry] = useState("");
  const [eventDevice, setEventDevice] = useState("");
  const [eventSession, setEventSession] = useState("");

  const compare =
    tab === "monthly" ? monthBounds(month) : { from, to, compareFrom: "", compareTo: "" };
  const rangeFrom = tab === "monthly" ? compare.from : from;
  const rangeTo = tab === "monthly" ? compare.to : to;

  useEffect(() => {
    let stop = false;
    async function load() {
      const params = new URLSearchParams({ from: rangeFrom, to: rangeTo });
      if (compare.compareFrom && compare.compareTo) {
        params.set("compareFrom", compare.compareFrom);
        params.set("compareTo", compare.compareTo);
      }
      const response = await fetch(`/api/admin/analytics?${params}`);
      const json = await response.json();
      if (stop) return;
      if (!response.ok) {
        setError(json.error || "Could not load analytics.");
        setLoading(false);
        return;
      }
      setReport(json);
      setError("");
      setLoading(false);
    }
    setLoading(true);
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [rangeFrom, rangeTo, compare.compareFrom, compare.compareTo]);

  useEffect(() => {
    if (tab !== "events") return;
    let stop = false;
    async function loadEvents() {
      const params = new URLSearchParams({
        from: rangeFrom,
        to: rangeTo,
        page: String(eventPage),
        type: eventType,
        path: eventPath,
        country: eventCountry,
        device: eventDevice,
        session: eventSession,
      });
      const response = await fetch(`/api/admin/analytics/events?${params}`);
      const json = await response.json();
      if (stop || !response.ok) return;
      setEvents(json.rows || []);
      setEventTotal(json.total || 0);
    }
    void loadEvents();
    const timer = window.setInterval(() => void loadEvents(), 15000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [tab, rangeFrom, rangeTo, eventPage, eventType, eventPath, eventCountry, eventDevice, eventSession]);

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setFrom(String(data.get("from") || from));
    setTo(String(data.get("to") || to));
    setTab("overview");
  }

  const maxBar = Math.max(1, ...(report?.series.map((row) => row.pageViews) || [1]));

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["overview", "Overview"],
            ["locations", "Locations"],
            ["journeys", "Journeys"],
            ["events", "Events"],
            ["monthly", "Monthly"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-md px-3 py-2 text-sm font-semibold ${tab === id ? "bg-cyan text-white" : "bg-white/10 text-white"}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab !== "monthly" && (
        <form onSubmit={applyRange} className="mt-4 flex flex-wrap items-end gap-2">
          <button type="button" className="rounded-md bg-white/10 px-3 py-2 text-sm text-white" onClick={() => { setFrom(today); setTo(today); }}>
            Today
          </button>
          <button type="button" className="rounded-md bg-white/10 px-3 py-2 text-sm text-white" onClick={() => { setFrom(shiftDays(today, -6)); setTo(today); }}>
            7 days
          </button>
          <button type="button" className="rounded-md bg-white/10 px-3 py-2 text-sm text-white" onClick={() => { setFrom(shiftDays(today, -29)); setTo(today); }}>
            30 days
          </button>
          <label className="text-xs text-white/60">
            From
            <input className="mt-1 block h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white" type="date" name="from" defaultValue={from} key={from} />
          </label>
          <label className="text-xs text-white/60">
            To
            <input className="mt-1 block h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white" type="date" name="to" defaultValue={to} key={to} />
          </label>
          <button className="h-11 rounded-md bg-cyan px-4 text-sm font-semibold text-white" type="submit">
            Apply
          </button>
        </form>
      )}

      {loading && !report && <p className="mt-6 text-sm text-white/70">Loading analytics…</p>}
      {error && <p className="mt-4 text-sm text-warn-red">{error}</p>}
      {report && report.summary.sessions === 0 && tab !== "events" && (
        <p className="surface mt-4 rounded-xl p-4 text-sm text-white/70">
          No visits in this range yet. Open the public site and choose Allow on the analytics prompt to start collection.
        </p>
      )}
      {report?.truncated && (
        <p className="mt-3 text-xs text-warn-yellow">
          This range is very large, so the report uses the latest 8,000 sessions and 20,000 events.
        </p>
      )}

      {report && tab === "overview" && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-cyan">Active in the last 5 minutes: {report.activeVisitors}</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Unique visitors" value={report.summary.users} delta={`${change(report.summary.users, report.previous.users)} vs previous period`} />
            <Stat label="Sessions" value={report.summary.sessions} delta={`${change(report.summary.sessions, report.previous.sessions)} vs previous period`} />
            <Stat label="Page views" value={report.summary.pageViews} delta={`${change(report.summary.pageViews, report.previous.pageViews)} vs previous period`} />
            <Stat label="Pages / session" value={report.summary.pagesPerSession} delta={`${change(report.summary.pagesPerSession, report.previous.pagesPerSession)} vs previous period`} />
            <Stat label="New visitors" value={report.summary.newVisitors} delta={`${change(report.summary.newVisitors, report.previous.newVisitors)} vs previous period`} />
            <Stat label="Returning" value={report.summary.returningVisitors} delta={`${change(report.summary.returningVisitors, report.previous.returningVisitors)} vs previous period`} />
            <Stat label="Avg. engagement" value={duration(report.summary.avgEngagementMs)} delta={`${change(report.summary.avgEngagementMs, report.previous.avgEngagementMs)} vs previous period`} />
            <Stat label="Bounce rate" value={`${Math.round(report.summary.bounceRate * 100)}%`} delta={`${change(report.summary.bounceRate, report.previous.bounceRate)} vs previous period`} />
          </div>
          <section className="surface rounded-2xl p-5">
            <h2 className="font-display text-2xl text-white">Daily page views</h2>
            {report.series.length === 0 ? (
              <p className="mt-3 text-sm text-white/60">No daily traffic in this range.</p>
            ) : (
              <div className="mt-4 flex h-40 items-end gap-2">
                {report.series.map((row) => (
                  <div key={row.date} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                    <div
                      className="w-full rounded-t bg-cyan"
                      style={{ height: `${Math.max(4, (row.pageViews / maxBar) * 100)}%` }}
                      title={`${row.date}: ${row.pageViews} views, ${row.sessions} sessions`}
                    />
                    <span className="mt-1 truncate text-[10px] text-white/50">{row.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
          <div className="grid gap-4 lg:grid-cols-2">
            <NameList title="Traffic sources" rows={report.sources.map((row) => ({ name: row.source, value: row.sessions }))} />
            <NameList title="Devices" rows={report.devices.map((row) => ({ name: row.name, value: row.sessions }))} />
          </div>
        </div>
      )}

      {report && tab === "locations" && (
        <div className="mt-4 space-y-4">
          <section className="surface rounded-2xl p-5">
            <h2 className="font-display text-2xl text-white">Visitor distribution</h2>
            <div className="mt-4">
              <VisitorMap
                rows={Object.values(
                  report.countries.reduce<Record<string, { country: string; sessions: number }>>((acc, row) => {
                    acc[row.country] = acc[row.country] || { country: row.country, sessions: 0 };
                    acc[row.country].sessions += row.sessions;
                    return acc;
                  }, {})
                )}
              />
            </div>
          </section>
          <DataTable
            headers={["Country", "Region", "City", "Sessions"]}
            rows={report.countries.map((row) => [row.country, row.region || "—", row.city || "—", String(row.sessions)])}
            empty="No location data in this range."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <NameList title="Browsers" rows={report.browsers.map((row) => ({ name: row.name, value: row.sessions }))} />
            <NameList title="Operating systems" rows={report.operatingSystems.map((row) => ({ name: row.name, value: row.sessions }))} />
          </div>
        </div>
      )}

      {report && tab === "journeys" && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <NameList title="Landing pages" rows={report.landingPages.map((row) => ({ name: row.path, value: row.sessions }))} />
            <NameList title="Estimated exit pages" rows={report.exitPages.map((row) => ({ name: row.path, value: row.sessions }))} />
          </div>
          <DataTable
            headers={["Estimated exit", "Sessions", "Single-page drop-off"]}
            rows={report.exitPages.map((row) => [row.path, String(row.sessions), String(row.bounces)])}
            empty="No exit estimates yet."
          />
          <div className="space-y-3">
            {report.journeys.length === 0 && (
              <p className="text-sm text-white/60">No sessions in this range.</p>
            )}
            {report.journeys.map((journey) => (
              <article key={journey.sessionId} className="surface rounded-2xl p-4">
                <p className="text-sm font-semibold text-white">
                  {journey.country} {journey.city ? `· ${journey.city}` : ""} · {journey.device} · {journey.source}
                </p>
                <p className="text-xs text-white/50">
                  {formatDate(journey.startedAt)} · last observed {journey.exitPath}
                </p>
                <ol className="mt-3 space-y-1 text-sm text-white/80">
                  {journey.pages.map((page, index) => (
                    <li key={`${page.ts}-${page.path}`}>
                      {index + 1}. {page.path} <span className="text-white/45">{page.title}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === "events" && (
        <form
          className="mt-4 grid gap-3 sm:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setEventPage(0);
            setEventType(String(data.get("type") || ""));
            setEventPath(String(data.get("path") || ""));
            setEventCountry(String(data.get("country") || ""));
            setEventDevice(String(data.get("device") || ""));
            setEventSession(String(data.get("session") || ""));
          }}
        >
          <select name="type" defaultValue={eventType} className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white">
            <option value="">All events</option>
            {ANALYTICS_EVENTS.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input name="path" defaultValue={eventPath} placeholder="Page path" className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white" />
          <input name="country" defaultValue={eventCountry} placeholder="Country" className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white" />
          <select name="device" defaultValue={eventDevice} className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white">
            <option value="">All devices</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
          </select>
          <input name="session" defaultValue={eventSession} placeholder="Session id" className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white" />
          <button className="h-11 rounded-md bg-cyan px-4 text-sm font-semibold text-white" type="submit">Filter</button>
          <div className="sm:col-span-3">
            <DataTable
              headers={["Time", "Event", "Name", "Page", "Country", "Device", "Session"]}
              rows={events.map((row) => [formatDate(row.ts), row.type, row.name, row.path, row.country || "—", row.device || "—", row.sessionId.slice(0, 10)])}
              empty="No events match these filters."
            />
            <div className="mt-3 flex items-center gap-3 text-sm text-white/70">
              <button type="button" className="text-cyan" disabled={eventPage === 0} onClick={() => setEventPage((page) => Math.max(0, page - 1))}>Previous</button>
              <span>{eventTotal === 0 ? "0" : `${eventPage * 25 + 1}–${Math.min(eventTotal, eventPage * 25 + events.length)}`} of {eventTotal}</span>
              <button type="button" className="text-cyan" disabled={(eventPage + 1) * 25 >= eventTotal} onClick={() => setEventPage((page) => page + 1)}>Next</button>
            </div>
          </div>
        </form>
      )}

      {report && tab === "monthly" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-white/60">
              Month
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="mt-1 block h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white"
              />
            </label>
            <a className="inline-flex h-11 items-center rounded-md bg-cyan px-4 text-sm font-semibold text-white" href={`/api/admin/analytics/export?month=${month}`}>
              Export CSV
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Unique visitors" value={report.summary.users} delta={`${change(report.summary.users, report.previous.users)} vs previous month`} />
            <Stat label="Sessions" value={report.summary.sessions} delta={`${change(report.summary.sessions, report.previous.sessions)} vs previous month`} />
            <Stat label="Page views" value={report.summary.pageViews} delta={`${change(report.summary.pageViews, report.previous.pageViews)} vs previous month`} />
            <Stat label="Engagement" value={duration(report.summary.avgEngagementMs)} delta={`${change(report.summary.avgEngagementMs, report.previous.avgEngagementMs)} vs previous month`} />
          </div>
          <NameList title="Top pages" rows={report.topPages.map((row) => ({ name: row.path, value: row.views }))} />
          <NameList title="Event counts" rows={report.eventCounts.map((row) => ({ name: row.type, value: row.count }))} />
          <DataTable
            headers={["Estimated exit", "Sessions", "Drop-off"]}
            rows={report.exitPages.map((row) => [row.path, String(row.sessions), String(row.bounces)])}
            empty="No drop-off data for this month."
          />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, delta }: { label: string; value: string | number; delta: string }) {
  return (
    <div className="surface rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-cyan">{label}</p>
      <p className="mt-1 font-display text-3xl text-white">{value}</p>
      <p className="text-xs text-white/50">{delta}</p>
    </div>
  );
}

function NameList({ title, rows }: { title: string; rows: { name: string; value: number }[] }) {
  return (
    <section className="surface rounded-2xl p-5">
      <h2 className="font-display text-2xl text-white">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-white/60">Nothing in this range.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-white/80">
          {rows.map((row) => (
            <li key={row.name} className="flex justify-between gap-3">
              <span className="truncate">{row.name}</span>
              <span>{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DataTable({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-white/60">{empty}</p>;
  return (
    <div className="surface overflow-x-auto rounded-2xl">
      <table className="min-w-full text-left text-sm text-white/80">
        <thead className="text-xs uppercase tracking-wider text-cyan">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.join("-")}-${index}`} className="border-t border-white/10">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
