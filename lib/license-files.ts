import { promises as fs } from "fs";
import path from "path";

export const LICENSE_UPLOAD_DIR = path.join(process.cwd(), "uploads", "licenses");

const ALLOWED = new Map<string, string>([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type LicenseSlot = "primary" | "location2" | "location3";

export function licenseFileError(file: File) {
  if (!ALLOWED.has(file.type)) {
    return "Upload a PDF, JPG, PNG, or WEBP file.";
  }
  if (file.size > 8 * 1024 * 1024) {
    return "License file must be 8 MB or smaller.";
  }
  return null;
}

export async function saveLicenseFile(userId: string, slot: LicenseSlot, file: File) {
  await fs.mkdir(LICENSE_UPLOAD_DIR, { recursive: true });
  const ext = ALLOWED.get(file.type) || "bin";
  const storedName = `${userId}-${slot}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(LICENSE_UPLOAD_DIR, storedName), buffer);
  return { storedName, fileName: file.name || `license.${ext}` };
}

export function licenseContentType(storedName: string) {
  const ext = storedName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export async function readLicenseFile(storedName: string) {
  if (!storedName || path.basename(storedName) !== storedName) return null;
  if (!/^[\w.-]+$/.test(storedName)) return null;
  try {
    return await fs.readFile(path.join(LICENSE_UPLOAD_DIR, storedName));
  } catch {
    return null;
  }
}
