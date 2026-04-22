import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

import { getRuntimeProductMediaMeta } from "@/lib/catalog/media-data";
import {
  buildPhotoImportLog,
  findLatestPhotoImportEntryByArchive,
  finishPhotoImportAttemptFailure,
  finishPhotoImportAttemptSuccess,
  getPhotoImportDashboard,
  startPhotoImportAttempt
} from "@/lib/catalog/photo-import-state";

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
  storedArchiveName: string;
  importedAt: string;
  articleCount: number;
  photoCount: number;
}

function sanitizeStoredArchiveName(value: string) {
  return path.basename(value);
}

async function importProductPhotosFromStoredArchive(
  storedArchiveName: string,
  sourceFileName: string
): Promise<ImportedPhotoArchiveResult> {
  const safeStoredArchiveName = sanitizeStoredArchiveName(storedArchiveName);
  const storedArchivePath = path.join(PHOTO_ARCHIVES_DIR, safeStoredArchiveName);

  await access(storedArchivePath);

  const attempt = await startPhotoImportAttempt(sourceFileName, safeStoredArchiveName);

  try {
    const { stdout, stderr } = await execFileAsync("python3", [
      path.join(process.cwd(), "scripts", "import_product_photos.py"),
      storedArchivePath,
      "--source-display-name",
      sourceFileName,
      "--output-dir",
      CURRENT_PHOTO_OUTPUT_DIR,
      "--manifest-path",
      CURRENT_PHOTO_MANIFEST_PATH,
      "--base-url",
      "/api/product-media/articles"
    ]);
    const meta = await getRuntimeProductMediaMeta();
    const log = buildPhotoImportLog(stdout, stderr);

    await finishPhotoImportAttemptSuccess(attempt.id, {
      sourceFileName: meta.sourceFileName,
      storedArchiveName: safeStoredArchiveName,
      importedAt: meta.importedAt,
      articleCount: meta.articleCount,
      photoCount: meta.photoCount,
      log
    });

    return {
      sourceFileName: meta.sourceFileName,
      storedArchiveName: safeStoredArchiveName,
      importedAt: meta.importedAt,
      articleCount: meta.articleCount,
      photoCount: meta.photoCount
    };
  } catch (error) {
    const stdout =
      typeof error === "object" && error && "stdout" in error
        ? String((error as { stdout?: unknown }).stdout ?? "")
        : "";
    const stderr =
      typeof error === "object" && error && "stderr" in error
        ? String((error as { stderr?: unknown }).stderr ?? "")
        : "";
    const message = error instanceof Error ? error.message : "Неизвестная ошибка импорта.";
    const log = buildPhotoImportLog(stdout, stderr, message);

    await finishPhotoImportAttemptFailure(attempt.id, {
      sourceFileName,
      storedArchiveName: safeStoredArchiveName,
      finishedAt: new Date().toISOString(),
      error: message,
      log
    });

    throw new Error(message);
  }
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

  return importProductPhotosFromStoredArchive(datedName, fileName);
}

export async function retryProductPhotosImport(
  storedArchiveName: string
): Promise<ImportedPhotoArchiveResult> {
  const safeStoredArchiveName = sanitizeStoredArchiveName(storedArchiveName);
  const existingEntry = await findLatestPhotoImportEntryByArchive(safeStoredArchiveName);
  const sourceFileName = existingEntry?.sourceFileName ?? safeStoredArchiveName;

  return importProductPhotosFromStoredArchive(safeStoredArchiveName, sourceFileName);
}

export function getAdminPhotoImportToken() {
  return (
    process.env.ADMIN_PHOTO_IMPORT_TOKEN?.trim() ??
    process.env.ADMIN_PRICE_IMPORT_TOKEN?.trim() ??
    ""
  );
}

export { getPhotoImportDashboard };
