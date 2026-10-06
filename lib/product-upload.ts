import { promises as fs } from "fs";
import path from "path";

export const PRODUCT_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "products"
);

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function productImageError(file: File): string | null {
  if (!ALLOWED.has(file.type)) {
    return "Only JPG, PNG, WEBP, or GIF allowed.";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "Max file size is 5MB.";
  }
  return null;
}

export function productImageExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

export async function saveProductImage(file: File, name: string) {
  await fs.mkdir(PRODUCT_UPLOAD_DIR, { recursive: true });
  const filename = `${name}.${productImageExtension(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(PRODUCT_UPLOAD_DIR, filename), buffer);
  return `/uploads/products/${filename}`;
}

export async function deleteStoredProductImage(publicPath: string) {
  if (!publicPath.startsWith("/uploads/products/")) return;
  const filename = path.basename(publicPath);
  if (!filename || filename !== path.basename(filename)) return;
  await fs.unlink(path.join(PRODUCT_UPLOAD_DIR, filename)).catch(() => undefined);
}
