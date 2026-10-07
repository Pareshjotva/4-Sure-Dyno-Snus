/** Tobacco purchase age when the visitor's province cannot be determined. */
export const FALLBACK_LEGAL_AGE = 19;

/**
 * Provincial and territorial purchase ages.
 * Age 18: Alberta, Manitoba, Northwest Territories, Nunavut, Quebec, Saskatchewan, Yukon.
 * Age 19: British Columbia, New Brunswick, Newfoundland and Labrador, Nova Scotia, Ontario.
 * Age 21: Prince Edward Island.
 */
const AGE_BY_CODE = {
  AB: 18,
  MB: 18,
  NT: 18,
  NU: 18,
  QC: 18,
  SK: 18,
  YT: 18,
  BC: 19,
  NB: 19,
  NL: 19,
  NS: 19,
  ON: 19,
  PE: 21,
} as const;

type ProvinceCode = keyof typeof AGE_BY_CODE;
export type CanadianPurchaseAge = (typeof AGE_BY_CODE)[ProvinceCode];

const ALIASES: Record<string, ProvinceCode> = {
  PQ: "QC",
  QU: "QC",
  NF: "NL",
  PEI: "PE",
  NWT: "NT",
  YK: "YT",
};

const NAME_TO_CODE: Record<string, ProvinceCode> = {
  alberta: "AB",
  manitoba: "MB",
  "northwest territories": "NT",
  "northwest territory": "NT",
  nunavut: "NU",
  quebec: "QC",
  saskatchewan: "SK",
  yukon: "YT",
  "yukon territory": "YT",
  "british columbia": "BC",
  "new brunswick": "NB",
  "newfoundland and labrador": "NL",
  newfoundland: "NL",
  "nova scotia": "NS",
  ontario: "ON",
  "prince edward island": "PE",
  pei: "PE",
};

const COMPACT_NAME_TO_CODE: Record<string, ProvinceCode> = Object.fromEntries(
  Object.entries(NAME_TO_CODE).map(([name, code]) => [
    name.replace(/ /g, ""),
    code,
  ])
);

const IPV4 =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
const IPV6 = /^(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;

export function legalAgeForCanadianProvince(
  region: string | null | undefined
): CanadianPurchaseAge | null {
  const code = provinceCode(region);
  if (!code) return null;
  return AGE_BY_CODE[code];
}

/** 18, 19, or 21 inside Canada; otherwise the site fallback of 19. */
export function purchaseAgeForLocation(
  country: string | null | undefined,
  region: string | null | undefined
): number {
  if ((country || "").trim().toUpperCase() !== "CA") return FALLBACK_LEGAL_AGE;
  return legalAgeForCanadianProvince(region) ?? FALLBACK_LEGAL_AGE;
}

export function normalizeIp(value: string | null | undefined): string | null {
  if (!value) return null;
  let ip = value.trim();
  if (!ip || ip.toLowerCase() === "unknown") return null;
  if (ip.startsWith('"') && ip.endsWith('"')) ip = ip.slice(1, -1).trim();
  if (ip.startsWith("[") && ip.includes("]")) {
    ip = ip.slice(1, ip.indexOf("]"));
  }
  const zone = ip.indexOf("%");
  if (zone !== -1) ip = ip.slice(0, zone);
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.slice(0, ip.lastIndexOf(":"));
  }
  if (ip.toLowerCase().startsWith("::ffff:")) ip = ip.slice(7);
  return ip || null;
}

export function isLookupSafeIp(ip: string): boolean {
  return IPV4.test(ip) || IPV6.test(ip);
}

/** Localhost, loopback, link-local, and private ranges are not geolocated. */
export function isNonPublicIp(ip: string): boolean {
  const normalized = normalizeIp(ip);
  if (!normalized) return true;
  const lower = normalized.toLowerCase();
  if (lower === "localhost" || lower === "::1" || lower === "::") return true;

  if (lower.includes(":")) {
    if (lower.startsWith("fe80:")) return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    return !isLookupSafeIp(lower);
  }

  if (!IPV4.test(lower)) return true;
  const [a, b] = lower.split(".").map((part) => Number(part));
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function provinceCode(region: string | null | undefined): ProvinceCode | null {
  if (!region) return null;
  const raw = region.trim().replace(/^CA[-_\s]+/i, "");
  if (!raw) return null;

  const letters = raw.toUpperCase().replace(/[^A-Z]/g, "");
  if (isProvinceCode(letters)) return letters;
  if (Object.prototype.hasOwnProperty.call(ALIASES, letters)) {
    return ALIASES[letters];
  }

  const folded = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (NAME_TO_CODE[folded]) return NAME_TO_CODE[folded];
  return COMPACT_NAME_TO_CODE[folded.replace(/ /g, "")] ?? null;
}

function isProvinceCode(value: string): value is ProvinceCode {
  return Object.prototype.hasOwnProperty.call(AGE_BY_CODE, value);
}
