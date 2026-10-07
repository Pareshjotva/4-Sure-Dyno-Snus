import { headers } from "next/headers";
import { cache } from "react";
import {
  FALLBACK_LEGAL_AGE,
  isLookupSafeIp,
  isNonPublicIp,
  normalizeIp,
  purchaseAgeForLocation,
} from "./canadian-legal-age";

const GEO_TIMEOUT_MS = 1000;

type HeaderSource = { get(name: string): string | null };

/**
 * Purchase age for this request. Vercel geo headers win when present.
 * Otherwise a public IP is looked up once, with a short timeout.
 * Localhost, private IPs, failed lookups, and non-Canadian locations use 19.
 */
export const getRequestLegalAge = cache(async function getRequestLegalAge() {
  try {
    const headerList = await headers();
    const vercelCountry = headerList.get("x-vercel-ip-country")?.trim() || "";
    const vercelRegion =
      headerList.get("x-vercel-ip-country-region")?.trim() || "";

    if (vercelCountry && vercelCountry.toUpperCase() !== "CA") {
      return FALLBACK_LEGAL_AGE;
    }
    if (vercelCountry.toUpperCase() === "CA" && vercelRegion) {
      return purchaseAgeForLocation("CA", vercelRegion);
    }

    const ip = clientIp(headerList);
    if (!ip || isNonPublicIp(ip) || !isLookupSafeIp(ip)) {
      return FALLBACK_LEGAL_AGE;
    }

    const geo = await lookupPublicIp(ip);
    if (!geo) return FALLBACK_LEGAL_AGE;
    return purchaseAgeForLocation(geo.country, geo.region);
  } catch {
    return FALLBACK_LEGAL_AGE;
  }
});

function clientIp(headerList: HeaderSource): string | null {
  const candidates: string[] = [];
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    for (const part of forwarded.split(",")) {
      const ip = normalizeIp(part);
      if (ip) candidates.push(ip);
    }
  }
  const realIp = normalizeIp(headerList.get("x-real-ip"));
  if (realIp) candidates.push(realIp);
  return candidates.find((ip) => !isNonPublicIp(ip)) ?? candidates[0] ?? null;
}

async function lookupPublicIp(
  ip: string
): Promise<{ country: string; region: string } | null> {
  try {
    const response = await fetch(`https://ipwho.is/${ip}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(GEO_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      success?: boolean;
      country_code?: string;
      region_code?: string;
      region?: string;
    };
    if (!data.success) return null;
    const country = (data.country_code || "").trim();
    if (!country) return null;
    return {
      country,
      region: (data.region_code || data.region || "").trim(),
    };
  } catch {
    return null;
  }
}
