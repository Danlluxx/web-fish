import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

import { getRuntimeProductMediaMeta } from "@/lib/catalog/media-data";

const execFileAsync = promisify(execFile);

const STORAGE_DIR = path.join(process.cwd(), "storage");
const PHOTO_ARCHIVES_DIR = path.join(STORAGE_DIR, "photo-archives");
const CURRENT_PHOTO_MANIFEST_PATH = path.join(STORAGE_DIR, "current-product-media.generated.json");
const CURRENT_PHOTO_OUTPUT_DIR = path.join(STORAGE_DIR, "product-images", "articles");

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "") || "product-photos.zip";
}

export interface ImportedPhotoArchiveResult {
  sourceFileName: string;
  importedAt: string;
  articleCount: number;
  photoCount: number;
}

export async function importProductPhotosFromBuffer(
  fileName: string,
  content: Buffer
): Promise<ImportedPhotoArchiveResult> {
  await mkdir(PHOTO_ARCHIVES_DIR, { recursive: true });
  await mkdir(STORAGE_DIR, { recursive: true });

  const safeName = sanitizeFilename(fileName);
  const datedName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${safeName}`;
  const storedArchivePath = path.join(PHOTO_ARCHIVES_DIR, datedName);

  await writeFile(storedArchivePath, content);

  await execFileAsync("python3", [
    path.join(process.cwd(), "scripts", "import_product_photos.py"),
    storedArchivePath,
    "--source-display-name",
    fileName,
    "--output-dir",
    CURRENT_PHOTO_OUTPUT_DIR,
    "--manifest-path",
    CURRENT_PHOTO_MANIFEST_PATH,
    "--base-url",
    "/api/product-media/articles"
  ]);

  return getRuntimeProductMediaMeta();
}

export function getAdminPhotoImportToken() {
  return (
    process.env.ADMIN_PHOTO_IMPORT_TOKEN?.trim() ??
    process.env.ADMIN_PRICE_IMPORT_TOKEN?.trim() ??
    ""
  );
}

