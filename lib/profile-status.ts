import type { ProfileStatus, StoredLicense, User } from "./types";

export const LICENSE_EXPIRED_MESSAGE =
  "Your license has expired. Please upload a valid license with a future expiry date.";

export const LICENSE_REQUIRED_MESSAGE =
  "Upload a tobacco retail license in your Profile before placing an order.";

export const LICENSE_REJECTED_MESSAGE =
  "Your license was rejected. Please upload a valid license in your Profile before placing an order.";

export const ORDER_PENDING_VERIFICATION_MESSAGE =
  "Your license is awaiting admin verification. You can submit this order, and it will be marked Pending Profile Verification.";

export const PROFILE_STATUS_LABEL: Record<ProfileStatus, string> = {
  incomplete: "Profile Incomplete",
  license_missing: "License Not Uploaded",
  pending: "License Pending Verification",
  rejected: "License Rejected",
  expired: "License Expired",
  verified: "Verified Profile",
};

export function todayISODate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isExpiryInPast(expiryDate: string, now = new Date()) {
  return !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate) || expiryDate < todayISODate(now);
}

function filled(value?: string) {
  return Boolean(value?.trim());
}

export function licenseIsCurrent(license?: StoredLicense, now = new Date()) {
  return Boolean(license?.storedName && license.expiryDate && !isExpiryInPast(license.expiryDate, now));
}

const REQUIRED_TEXT: { key: keyof User; label: string }[] = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "email", label: "Email address" },
  { key: "country", label: "Country" },
  { key: "company", label: "Company/store name" },
  { key: "address", label: "Store address" },
  { key: "city", label: "City" },
  { key: "postalCode", label: "Postal code" },
  { key: "phone", label: "Phone number" },
];

export function profileStatus(user: User, now = new Date()): ProfileStatus {
  const license = user.license;
  const hasFile = Boolean(license?.storedName);
  const expired = hasFile && (!license?.expiryDate || isExpiryInPast(license.expiryDate, now));
  if (expired) return "expired";
  if (
    hasFile &&
    (license?.review === "rejected" || user.verificationReview === "rejected") &&
    license?.review !== "pending"
  ) {
    return "rejected";
  }
  const textComplete = REQUIRED_TEXT.every((field) => filled(user[field.key] as string | undefined));
  if (!textComplete) return "incomplete";
  if (!hasFile) return "license_missing";
  if (license?.review === "approved" && user.verificationReview === "approved") {
    return "verified";
  }
  return "pending";
}

export function profileCompletion(user: User, now = new Date()) {
  const status = profileStatus(user, now);
  let done = REQUIRED_TEXT.filter((field) => filled(user[field.key] as string | undefined)).length;
  if (user.license?.storedName) done += 1;
  if (licenseIsCurrent(user.license, now)) done += 1;
  if (status === "verified") done += 1;
  const total = REQUIRED_TEXT.length + 3;
  const raw = Math.round((done / total) * 100);
  const percent = status === "verified" ? 100 : Math.min(raw, 92);
  return { percent, status, label: PROFILE_STATUS_LABEL[status] };
}

export function orderEligibility(user: User, now = new Date()) {
  const status = profileStatus(user, now);
  const license = user.license;
  if (!license?.storedName) {
    return { allowed: false, pending: false, status, message: LICENSE_REQUIRED_MESSAGE };
  }
  if (!licenseIsCurrent(license, now)) {
    return { allowed: false, pending: false, status, message: LICENSE_EXPIRED_MESSAGE };
  }
  if (status === "rejected" || license.review === "rejected") {
    return { allowed: false, pending: false, status, message: LICENSE_REJECTED_MESSAGE };
  }
  if (status !== "verified") {
    return {
      allowed: true,
      pending: true,
      status,
      message: ORDER_PENDING_VERIFICATION_MESSAGE,
    };
  }
  return { allowed: true, pending: false, status, message: "" };
}

export function profileDetail(status: ProfileStatus) {
  switch (status) {
    case "verified":
      return "Your profile and tobacco license have been verified. You can place orders.";
    case "pending":
      return "Your license is uploaded and waiting for admin verification. Your profile is not 100% complete until it is verified.";
    case "license_missing":
      return "Upload your tobacco retail dealer's permit in this profile before you place an order.";
    case "rejected":
      return "Your license was rejected. Upload a valid license before you place an order.";
    case "expired":
      return LICENSE_EXPIRED_MESSAGE;
    default:
      return "Complete the required profile fields and upload a valid tobacco license.";
  }
}
