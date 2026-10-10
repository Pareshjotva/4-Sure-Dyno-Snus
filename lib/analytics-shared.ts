export const ANALYTICS_SOURCES = [
  "google",
  "bing",
  "social",
  "referral",
  "direct",
  "paid",
] as const;

export const ANALYTICS_EVENTS = [
  "pageview",
  "click",
  "outbound",
  "download",
  "scroll",
  "form_submit",
  "form_invalid",
  "signup",
  "login",
  "search",
  "product_view",
  "lead",
  "purchase",
  "engagement",
  "custom",
] as const;

export type AnalyticsSource = (typeof ANALYTICS_SOURCES)[number];
export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsMetrics {
  users: number;
  sessions: number;
  pageViews: number;
  newVisitors: number;
  returningVisitors: number;
  avgEngagementMs: number;
  bounceRate: number;
  pagesPerSession: number;
}

export interface AnalyticsReport {
  from: string;
  to: string;
  compareFrom: string;
  compareTo: string;
  activeVisitors: number;
  truncated: boolean;
  summary: AnalyticsMetrics;
  previous: AnalyticsMetrics;
  series: { date: string; pageViews: number; sessions: number }[];
  countries: { country: string; region: string; city: string; sessions: number }[];
  sources: { source: string; sessions: number }[];
  devices: { name: string; sessions: number }[];
  browsers: { name: string; sessions: number }[];
  operatingSystems: { name: string; sessions: number }[];
  topPages: { path: string; views: number; avgEngagementMs: number }[];
  landingPages: { path: string; sessions: number }[];
  exitPages: { path: string; sessions: number; bounces: number }[];
  eventCounts: { type: string; count: number }[];
  journeys: {
    sessionId: string;
    startedAt: string;
    lastSeenAt: string;
    landingPath: string;
    exitPath: string;
    country: string;
    city: string;
    device: string;
    source: string;
    pages: { path: string; title: string; ts: string }[];
  }[];
}
