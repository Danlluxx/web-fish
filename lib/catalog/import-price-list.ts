import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

import { getRuntimeCatalog, getRuntimeCatalogMeta, type CatalogMeta } from "@/lib/catalog/data-source";
import { pruneStoredFiles } from "@/lib/storage/retention";
import type { Product } from "@/types/catalog";

const execFileAsync = promisify(execFile);

const STORAGE_DIR = path.join(process.cwd(), "storage");
const PRICE_LISTS_DIR = path.join(STORAGE_DIR, "price-lists");
const CURRENT_PRICE_PATH = path.join(STORAGE_DIR, "current-price.xlsx");
const CURRENT_CATALOG_PATH = path.join(STORAGE_DIR, "current-catalog.generated.json");
const STORED_PRICE_LIST_LIMIT = 30;

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "") || "price-list.xlsx";
}

export function getCurrentPricePublicPath() {
  return "/api/price-list";
}

export interface ImportedPriceListResult {
  catalogTitle: string;
  sourceFileName: string;
  importedAt: string;
  productCount: number;
  newArrivalCount?: number;
}

interface GeneratedCatalog {
  meta: CatalogMeta;
  sections: Array<{
    title: string;
    slug: string;
    description: string;
    subcategories: Array<{
      title: string;
      slug: string;
      description: string;
    }>;
  }>;
  products: Array<Omit<Product, "imageAccent">>;
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

function buildProductIdentity(product: Pick<Product, "article" | "title" | "categorySlug" | "subcategorySlug">) {
  const normalizedArticle = normalizeText(product.article)?.toUpperCase();

  if (normalizedArticle) {
    return `article:${normalizedArticle}`;
  }

  return [
    "title",
    normalizeText(product.title),
    product.categorySlug,
    product.subcategorySlug
  ].join("|");
}

function getNewArrivalSlugs(previousProducts: Product[], nextProducts: Array<Omit<Product, "imageAccent">>) {
  const previousKeys = new Set(previousProducts.map((product) => buildProductIdentity(product)));

  return nextProducts
    .filter((product) => !previousKeys.has(buildProductIdentity(product)))
    .map((product) => product.slug);
}

export async function importPriceListFromBuffer(fileName: string, content: Buffer): Promise<ImportedPriceListResult> {
  await mkdir(PRICE_LISTS_DIR, { recursive: true });
  await mkdir(STORAGE_DIR, { recursive: true });

  const previousCatalog = await getRuntimeCatalog();

  const safeName = sanitizeFilename(fileName);
  const datedName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${safeName}`;
  const storedSourcePath = path.join(PRICE_LISTS_DIR, datedName);

  await writeFile(storedSourcePath, content);
  await pruneStoredFiles(PRICE_LISTS_DIR, STORED_PRICE_LIST_LIMIT);

  await execFileAsync("python3", [
    path.join(process.cwd(), "scripts", "import_price_list.py"),
    storedSourcePath,
    "--source-display-name",
    fileName,
    "--output",
    CURRENT_CATALOG_PATH,
    "--copy-price-list-to",
    CURRENT_PRICE_PATH
  ]);

  const importedRawCatalog = await readFile(CURRENT_CATALOG_PATH, "utf-8");
  const importedCatalog = JSON.parse(importedRawCatalog) as GeneratedCatalog;
  const newArrivalSlugs = getNewArrivalSlugs(previousCatalog.products, importedCatalog.products);

  importedCatalog.meta = {
    ...importedCatalog.meta,
    previousSourceFileName: previousCatalog.meta.sourceFileName,
    previousImportedAt: previousCatalog.meta.importedAt,
    newArrivalCount: newArrivalSlugs.length,
    newArrivalSlugs
  };

  await writeFile(CURRENT_CATALOG_PATH, JSON.stringify(importedCatalog, null, 2) + "\n", "utf-8");

  return getRuntimeCatalogMeta();
}

export function getCurrentPriceStoragePath() {
  return CURRENT_PRICE_PATH;
}

export function getAdminImportToken() {
  return process.env.ADMIN_PRICE_IMPORT_TOKEN?.trim() ?? "";
}
