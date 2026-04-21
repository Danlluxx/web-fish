import "server-only";

import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

interface ProductMediaManifest {
  meta?: {
    sourceFileName?: string;
    importedAt?: string;
    articleCount?: number;
    photoCount?: number;
  };
  articles?: Record<string, string[]>;
}

export interface RuntimeProductMediaMeta {
  sourceFileName: string;
  importedAt: string;
  articleCount: number;
  photoCount: number;
}

const STORAGE_MEDIA_MANIFEST_PATH = path.join(
  process.cwd(),
  "storage",
  "current-product-media.generated.json"
);
const FALLBACK_MEDIA_MANIFEST_PATH = path.join(
  process.cwd(),
  "data",
  "product-media.generated.json"
);

let cache:
  | {
      path: string;
      mtimeMs: number;
      data: ProductMediaManifest;
    }
  | null = null;

async function resolveManifestPath(): Promise<string> {
  try {
    await access(STORAGE_MEDIA_MANIFEST_PATH);
    return STORAGE_MEDIA_MANIFEST_PATH;
  } catch {
    return FALLBACK_MEDIA_MANIFEST_PATH;
  }
}

async function getRuntimeProductMediaManifest(): Promise<ProductMediaManifest> {
  const manifestPath = await resolveManifestPath();
  const stats = await stat(manifestPath);

  if (cache && cache.path === manifestPath && cache.mtimeMs === stats.mtimeMs) {
    return cache.data;
  }

  const raw = await readFile(manifestPath, "utf-8");
  const parsed = JSON.parse(raw) as ProductMediaManifest;

  cache = {
    path: manifestPath,
    mtimeMs: stats.mtimeMs,
    data: parsed
  };

  return parsed;
}

function normalizeArticle(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.replace(/\s+/g, "").toUpperCase();
}

export async function getRuntimeProductMediaMeta(): Promise<RuntimeProductMediaMeta> {
  const manifest = await getRuntimeProductMediaManifest();
  const articles = manifest.articles ?? {};
  const articleCount = manifest.meta?.articleCount ?? Object.keys(articles).length;
  const photoCount =
    manifest.meta?.photoCount ??
    Object.values(articles).reduce((total, paths) => total + paths.length, 0);

  return {
    sourceFileName: manifest.meta?.sourceFileName ?? "Фотографии ещё не загружались",
    importedAt: manifest.meta?.importedAt ?? "",
    articleCount,
    photoCount
  };
}

export async function getRuntimeProductMediaByArticle(
  article: string | null | undefined
): Promise<string[] | null> {
  const normalizedArticle = normalizeArticle(article);

  if (!normalizedArticle) {
    return null;
  }

  const manifest = await getRuntimeProductMediaManifest();
  return manifest.articles?.[normalizedArticle] ?? null;
}

