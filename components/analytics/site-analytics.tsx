"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const VISITOR_KEY = "dyno_vid";
const SESSION_KEY = "dyno_sid";

function id(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2);
  return `${prefix}${random}`.slice(0, 40);
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify({ ...payload, consent: true });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/collect", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/analytics/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

function AnalyticsTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let visitorId = "";
    let sessionId = "";
    try {
      visitorId = localStorage.getItem(VISITOR_KEY) || id("v");
      localStorage.setItem(VISITOR_KEY, visitorId);
      sessionId = sessionStorage.getItem(SESSION_KEY) || id("s");
      sessionStorage.setItem(SESSION_KEY, sessionId);
    } catch {
      return;
    }

    const path = `${pathname}${query ? `?${query}` : ""}`.slice(0, 200);
    const utm = {
      source: search.get("utm_source") || "",
      medium: search.get("utm_medium") || "",
      campaign: search.get("utm_campaign") || "",
      term: search.get("utm_term") || "",
      content: search.get("utm_content") || "",
    };
    const started = Date.now();
    const sentScroll = new Set<number>();
    let flushed = false;

    function base(extra: Record<string, unknown> = {}) {
      return {
        id: id("e"),
        sessionId,
        visitorId,
        path,
        title: document.title.slice(0, 150),
        referrer: document.referrer,
        ts: new Date().toISOString(),
        utm,
        ...extra,
      };
    }

    send(base({ type: "pageview", name: document.title.slice(0, 80) || "Page view" }));
    if (/^\/products\/[^/]+/.test(pathname)) {
      send(base({ type: "product_view", name: pathname.split("/")[2] || "product" }));
    }
    if (search.get("q") || search.get("search")) {
      send(base({ type: "search", name: "search", metadata: { hasQuery: true } }));
    }

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-analytics-ignore]")) return;
      const link = target.closest("a");
      const button = target.closest("button, [role='button']");
      const el = link || button;
      if (!el) return;
      const raw = (
        el.getAttribute("data-analytics") ||
        el.getAttribute("aria-label") ||
        el.textContent ||
        "interaction"
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      const name = /\S+@\S+/.test(raw) || /\d{7,}/.test(raw) ? "interaction" : raw || "interaction";
      if (link instanceof HTMLAnchorElement) {
        const href = link.href;
        const download = link.hasAttribute("download") || /\.(pdf|zip|csv|docx?)($|\?)/i.test(href);
        let outbound = false;
        try {
          outbound = Boolean(href) && new URL(href).host !== location.host;
        } catch {
          outbound = false;
        }
        send(
          base({
            type: download ? "download" : outbound ? "outbound" : "click",
            name,
            metadata: { href: (link.getAttribute("href") || "").slice(0, 80) },
          })
        );
        return;
      }
      send(base({ type: "click", name }));
    }

    function formKind() {
      if (pathname.startsWith("/register")) return "signup";
      if (pathname.startsWith("/login")) return "login";
      if (pathname.startsWith("/contact") || pathname.startsWith("/wholesale")) return "lead";
      if (pathname.startsWith("/account/order")) return "purchase";
      return "form_submit";
    }

    function onSubmit(event: Event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.closest("[data-analytics-ignore]")) return;
      send(base({ type: formKind(), name: form.getAttribute("name") || form.id || "form" }));
    }

    function onInvalid(event: Event) {
      const form = event.target instanceof Element ? event.target.closest("form") : null;
      if (!form || form.closest("[data-analytics-ignore]")) return;
      send(base({ type: "form_invalid", name: form.getAttribute("name") || form.id || "form" }));
    }

    function onScroll() {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const depth = height <= 0 ? 100 : Math.round((window.scrollY / height) * 100);
      for (const mark of [25, 50, 75, 90]) {
        if (depth >= mark && !sentScroll.has(mark)) {
          sentScroll.add(mark);
          send(base({ type: "scroll", name: `scroll_${mark}`, scrollDepth: mark }));
        }
      }
    }

    function onHide() {
      if (flushed) return;
      const elapsed = Date.now() - started;
      if (elapsed < 500) return;
      flushed = true;
      send(base({ type: "engagement", name: "page_engagement", engagementMs: elapsed }));
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") onHide();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("invalid", onInvalid, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      onHide();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("invalid", onInvalid, true);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
    };
  }, [pathname, query, search]);

  return null;
}

export function SiteAnalytics() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <Suspense fallback={null}>
      <AnalyticsTracker />
    </Suspense>
  );
}
