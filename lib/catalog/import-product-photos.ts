import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

import { getRuntimeProductMediaMeta } from "@/lib/catalog/media-data";
import { isSafeProductMediaUrl } from "@/lib/catalog/media-url";
import {
  buildPhotoImportLog,
  findLatestPhotoImportEntryByArchive,
  finishPhotoImportAttemptFailure,
  finishPhotoImportAttemptSuccess,
  getPhotoImportDashboard,
  startPhotoImportAttempt
} from "@/lib/catalog/photo-import-state";
import { pruneStoredFiles } from "@/lib/storage/retention";

const execFileAsync = promisify(execFile);

const STORAGE_DIR = path.join(process.cwd(), "storage");
const PHOTO_ARCHIVES_DIR = path.join(STORAGE_DIR, "photo-archives");
const CURRENT_PHOTO_MANIFEST_PATH = path.join(STORAGE_DIR, "current-product-media.generated.json");
const CURRENT_PHOTO_OUTPUT_DIR = path.join(STORAGE_DIR, "product-images", "articles");
const STORED_PHOTO_ARCHIVE_LIMIT = 10;

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

interface ProductMediaManifest {
  meta?: {
    sourceFileName?: string;
    importedAt?: string;
    articleCount?: number;
    photoCount?: number;
  };
  articles?: Record<string, string[]>;
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
  await pruneStoredFiles(PHOTO_ARCHIVES_DIR, STORED_PHOTO_ARCHIVE_LIMIT);

  return importProductPhotosFromStoredArchive(datedName, fileName);
}

function normalizeManifestArticle(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function normalizeProductMediaManifest(
  manifest: ProductMediaManifest,
  sourceFileName: string
): ProductMediaManifest {
  const articles: Record<string, string[]> = {};

  for (const [rawArticle, rawSources] of Object.entries(manifest.articles ?? {})) {
    const article = normalizeManifestArticle(rawArticle);

    if (!article || !Array.isArray(rawSources)) {
      continue;
    }

    const sources = rawSources
      .map((source) => String(source).trim())
      .filter(isSafeProductMediaUrl);

    if (sources.length > 0) {
      articles[article] = sources;
    }
  }

  const photoCount = Object.values(articles).reduce((total, sources) => total + sources.length, 0);

  if (photoCount === 0) {
    throw new Error("В манифесте не найдено ни одной безопасной ссылки на фотографии.");
  }

  return {
    meta: {
      sourceFileName,
      importedAt: new Date().toISOString(),
      articleCount: Object.keys(articles).length,
      photoCount
    },
    articles: Object.fromEntries(
      Object.entries(articles).sort(([left], [right]) => left.localeCompare(right))
    )
  };
}

export async function importProductMediaManifestFromBuffer(
  fileName: string,
  content: Buffer
): Promise<ImportedPhotoArchiveResult> {
  const safeName = sanitizeFilename(fileName);
  const attempt = await startPhotoImportAttempt(fileName, safeName);

  try {
    const parsed = JSON.parse(content.toString("utf-8")) as ProductMediaManifest;
    const manifest = normalizeProductMediaManifest(parsed, fileName);

    await mkdir(STORAGE_DIR, { recursive: true });
    await writeFile(CURRENT_PHOTO_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

    const meta = await getRuntimeProductMediaMeta();
    const log = buildPhotoImportLog(
      `Manifest saved to ${CURRENT_PHOTO_MANIFEST_PATH}\nMedia source: ${
        meta.mediaBaseUrl || "manifest urls"
      }`,
      ""
    );

    await finishPhotoImportAttemptSuccess(attempt.id, {
      sourceFileName: meta.sourceFileName,
      storedArchiveName: safeName,
      importedAt: meta.importedAt,
      articleCount: meta.articleCount,
      photoCount: meta.photoCount,
      log
    });

    return {
      sourceFileName: meta.sourceFileName,
      storedArchiveName: safeName,
      importedAt: meta.importedAt,
      articleCount: meta.articleCount,
      photoCount: meta.photoCount
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка импорта.";
    const finishedAt = new Date().toISOString();

    await finishPhotoImportAttemptFailure(attempt.id, {
      sourceFileName: fileName,
      storedArchiveName: safeName,
      finishedAt,
      error: message,
      log: buildPhotoImportLog("", "", message)
    });

    throw new Error(message);
  }
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
