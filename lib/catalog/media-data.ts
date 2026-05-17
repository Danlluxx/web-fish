import "server-only";

import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { getConfiguredProductMediaBaseUrl, resolveProductMediaUrl } from "@/lib/catalog/media-url";

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
  mediaBaseUrl: string;
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
const STORAGE_PRODUCT_MEDIA_DIR = path.join(process.cwd(), "storage", "product-images");

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

const CYRILLIC_ARTICLE_TO_LATIN: Record<string, string> = {
  А: "A",
  Б: "B",
  В: "B",
  Г: "G",
  Д: "D",
  Е: "E",
  Ё: "E",
  Ж: "ZH",
  З: "Z",
  И: "I",
  Й: "Y",
  К: "K",
  Л: "L",
  М: "M",
  Н: "H",
  О: "O",
  П: "P",
  Р: "P",
  С: "C",
  Т: "T",
  У: "Y",
  Ф: "F",
  Х: "X",
  Ц: "TS",
  Ч: "CH",
  Ш: "SH",
  Щ: "SCH",
  Ъ: "",
  Ы: "Y",
  Ь: "",
  Э: "E",
  Ю: "YU",
  Я: "YA"
};

function buildArticleLookupKeys(article: string): string[] {
  const transliterated = Array.from(
    article,
    (character) => CYRILLIC_ARTICLE_TO_LATIN[character] ?? character
  ).join("");

  return transliterated === article ? [article] : [article, transliterated];
}

function extractLocalArticleMediaPath(source: string): string | null {
  const cleanedSource = source.trim();
  const knownPrefixes = [
    "/api/product-media/",
    "/images/products/",
    "/product-images/"
  ];

  for (const prefix of knownPrefixes) {
    if (cleanedSource.startsWith(prefix)) {
      return cleanedSource.slice(prefix.length).replace(/^\/+/g, "");
    }
  }

  try {
    const url = new URL(cleanedSource);
    const marker = "/product-images/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length)).replace(/^\/+/g, "");
  } catch {
    return null;
  }
}

async function resolveLocalProductMediaUrl(source: string): Promise<string | null> {
  const relativePath = extractLocalArticleMediaPath(source);

  if (!relativePath || relativePath.includes("\0")) {
    return null;
  }

  const mediaPath = path.resolve(STORAGE_PRODUCT_MEDIA_DIR, relativePath);

  if (!mediaPath.startsWith(`${STORAGE_PRODUCT_MEDIA_DIR}${path.sep}`)) {
    return null;
  }

  try {
    await access(mediaPath);
  } catch {
    return null;
  }

  return `/api/product-media/${relativePath.split(path.sep).join("/")}`;
}

async function resolveRuntimeProductMediaUrl(source: string): Promise<string> {
  return (await resolveLocalProductMediaUrl(source)) ?? resolveProductMediaUrl(source);
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
    photoCount,
    mediaBaseUrl: getConfiguredProductMediaBaseUrl()
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
  const media =
    buildArticleLookupKeys(normalizedArticle)
      .map((lookupKey) => manifest.articles?.[lookupKey])
      .find((paths): paths is string[] => Boolean(paths?.length)) ?? null;

  return media ? Promise.all(media.map(resolveRuntimeProductMediaUrl)) : null;
}
