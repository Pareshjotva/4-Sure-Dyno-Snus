"use client";

import { type AnalyticsReport } from "@/lib/analytics-shared";
import { FilterBar, matchesQuery } from "@/components/ui/filter-bar";
import { FormEvent, useEffect, useState } from "react";

type Tab = "overview" | "locations" | "journeys" | "events" | "monthly";

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

function eventLabel(type: string) {
  return type.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
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
  const [query, setQuery] = useState("");

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
    setQuery("");
  }, [tab]);

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
            ["journeys", "Pages"],
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
          No visits in this range yet. Open a public page and the visit will be tracked automatically.
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
          <FilterBar query={query} onQuery={setQuery} placeholder="Search country or city" />
          <DataTable
            headers={["Country", "City", "Users"]}
            rows={report.countries
              .filter((row) => matchesQuery(query, row.country, row.city))
              .map((row) => [row.country, row.city || "—", String(row.users)])}
            empty={query ? "Nothing matches this filter." : "No location data in this range."}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <NameList title="Browsers" rows={report.browsers.map((row) => ({ name: row.name, value: row.sessions }))} />
            <NameList title="Operating systems" rows={report.operatingSystems.map((row) => ({ name: row.name, value: row.sessions }))} />
          </div>
        </div>
      )}

      {report && tab === "journeys" && (
        <div className="mt-4 space-y-4">
          <FilterBar query={query} onQuery={setQuery} placeholder="Search page" />
          <DataTable
            headers={["Page", "Users"]}
            rows={report.topPages
              .filter((row) => matchesQuery(query, row.path))
              .map((row) => [row.path, String(row.users)])}
            empty={query ? "Nothing matches this filter." : "No page visits in this range."}
          />
        </div>
      )}

      {report && tab === "events" && (
        <div className="mt-4 space-y-4">
          <FilterBar query={query} onQuery={setQuery} placeholder="Search event" />
          <DataTable
            headers={["Event", "Count"]}
            rows={report.eventCounts
              .filter((row) => matchesQuery(query, eventLabel(row.type), row.type))
              .map((row) => [eventLabel(row.type), String(row.count)])}
            empty={query ? "Nothing matches this filter." : "No events in this range."}
          />
        </div>
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
          <FilterBar query={query} onQuery={setQuery} placeholder="Search pages or events" />
          <NameList
            title="Top pages"
            rows={report.topPages
              .filter((row) => matchesQuery(query, row.path))
              .map((row) => ({ name: row.path, value: row.views }))}
            empty={query ? "Nothing matches this filter." : "Nothing in this range."}
          />
          <NameList
            title="Event counts"
            rows={report.eventCounts
              .filter((row) => matchesQuery(query, eventLabel(row.type), row.type))
              .map((row) => ({ name: eventLabel(row.type), value: row.count }))}
            empty={query ? "Nothing matches this filter." : "Nothing in this range."}
          />
          <DataTable
            headers={["Estimated exit", "Sessions", "Drop-off"]}
            rows={report.exitPages
              .filter((row) => matchesQuery(query, row.path))
              .map((row) => [row.path, String(row.sessions), String(row.bounces)])}
            empty={query ? "Nothing matches this filter." : "No drop-off data for this month."}
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

function NameList({
  title,
  rows,
  empty = "Nothing in this range.",
}: {
  title: string;
  rows: { name: string; value: number }[];
  empty?: string;
}) {
  return (
    <section className="surface rounded-2xl p-5">
      <h2 className="font-display text-2xl text-white">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-white/60">{empty}</p>
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
