"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Box = { top: number; left: number; width: number; height: number };

function visibleBox(el: Element): Box {
  const rect = el.getBoundingClientRect();
  const header = document.querySelector("header");
  const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
  const top = Math.max(rect.top, headerBottom, 0);
  const left = Math.max(rect.left, 0);
  const right = Math.min(rect.right, window.innerWidth);
  const bottom = Math.min(rect.bottom, window.innerHeight);
  const height = bottom - top;
  const width = right - left;
  if (height < 80 || width < 80) {
    return {
      top: Math.max(rect.top, 8),
      left: Math.max(rect.left, 8),
      width: Math.max(rect.width, 160),
      height: Math.max(Math.min(rect.height, window.innerHeight * 0.7), 180),
    };
  }
  return { top, left, width, height };
}

function isModified(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isPageLink(anchor: HTMLAnchorElement) {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  const href = anchor.getAttribute("href") || "";
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  let url: URL;
  try {
    url = new URL(anchor.href, location.href);
  } catch {
    return false;
  }
  if (url.origin !== location.origin) return false;
  return url.pathname !== location.pathname || url.search !== location.search;
}

function ClickFeedbackInner() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [box, setBox] = useState<Box | null>(null);
  const [scope, setScope] = useState<Element | null>(null);

  useEffect(() => {
    setBox(null);
    setScope(null);
    document.querySelectorAll("[data-click-loading]").forEach((el) => {
      el.removeAttribute("data-click-loading");
    });
  }, [pathname, search]);

  useEffect(() => {
    if (!scope) return;
    let frame = 0;
    function sync() {
      if (!scope?.isConnected) {
        setBox(null);
        setScope(null);
        return;
      }
      setBox(visibleBox(scope));
    }
    function onMove() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(sync);
    }
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    const safety = window.setTimeout(() => {
      setBox(null);
      setScope(null);
    }, 12000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(safety);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [scope]);

  useEffect(() => {
    const timers = new Set<number>();

    function reveal(next: Element) {
      setScope(next);
      setBox(visibleBox(next));
    }

    function onClick(event: MouseEvent) {
      if (isModified(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-loading-ignore], [data-analytics-ignore], .page-loading-veil")) return;

      const anchor = target.closest("a");
      if (anchor instanceof HTMLAnchorElement && isPageLink(anchor)) {
        anchor.setAttribute("data-click-loading", "");
        const section = anchor.closest("[data-section-loading]");
        const page = document.querySelector("[data-page-loading]");
        const next = section || page;
        if (next) reveal(next);
        return;
      }

      const control = target.closest("button, [role='button']");
      if (!(control instanceof HTMLElement) || control.closest("a")) return;
      control.setAttribute("data-click-loading", "");
      if (control.hasAttribute("data-page-action")) {
        const page = document.querySelector("[data-page-loading]");
        if (page) reveal(page);
        return;
      }

      const form = control.closest("form");
      const type = control.getAttribute("type");
      const submitsForm =
        form && (type === "submit" || (type === null && control.tagName === "BUTTON"));
      if (submitsForm && form) {
        const timer = window.setTimeout(() => {
          if (control.hasAttribute("disabled") || control.getAttribute("aria-busy") === "true") {
            reveal(form);
          } else {
            control.removeAttribute("data-click-loading");
          }
        }, 50);
        timers.add(timer);
        return;
      }

      const timer = window.setTimeout(() => control.removeAttribute("data-click-loading"), 650);
      timers.add(timer);
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!scope || !scope.closest("form")) return;
    const form = scope.closest("form");
    if (!form) return;
    const button = form.querySelector("button[disabled], button[aria-busy='true']");
    if (!(button instanceof HTMLElement)) return;
    const obs = new MutationObserver(() => {
      if (!button.isConnected || (!button.hasAttribute("disabled") && button.getAttribute("aria-busy") !== "true")) {
        button.removeAttribute("data-click-loading");
        setBox(null);
        setScope(null);
      }
    });
    obs.observe(button, { attributes: true, attributeFilter: ["disabled", "aria-busy"] });
    return () => obs.disconnect();
  }, [scope]);

  if (!box) return null;

  return (
    <div
      className="page-loading-veil"
      role="status"
      aria-live="polite"
      style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
    >
      <span className="page-loading-sweep" />
      <span className="sr-only">Loading</span>
      <span className="page-loading-line" style={{ width: "42%" }} />
      <span className="page-loading-line" style={{ width: "78%" }} />
      <span className="page-loading-line" style={{ width: "61%" }} />
      <span className="page-loading-line" style={{ width: "34%" }} />
    </div>
  );
}

export function ClickFeedback() {
  return (
    <Suspense fallback={null}>
      <ClickFeedbackInner />
    </Suspense>
  );
}
