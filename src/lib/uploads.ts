import { put } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "products");
export const UPLOADS_URL_PREFIX = "/uploads/products";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export interface UploadedImage {
  url: string;
  size: number;
}

export function validateImageFile(file: File): string | null {
  const ext = MIME_EXT[file.type];
  if (!ext) return "Only JPG, PNG, WebP or GIF images are supported.";
  if (file.size <= 0) return "The image file is empty.";
  if (file.size > MAX_FILE_SIZE) return "Image must be 8 MB or smaller.";
  return null;
}

/**
 * Persists an image to Vercel Blob (or fallback to `public/uploads/products` locally) and returns its URL.
 */
export async function saveUploadedImage(file: File): Promise<UploadedImage> {
  const ext = MIME_EXT[file.type];
  if (!ext) throw new Error("Unsupported image type.");

  // If Vercel Blob token is configured, save directly to high-speed global CDN
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const filename = `products/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });
    return { url: blob.url, size: file.size };
  }

  // Fallback for offline local development
  await mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOADS_DIR, filename), bytes);

  return { url: `${UPLOADS_URL_PREFIX}/${filename}`, size: bytes.length };
}