import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { getRuntimeCatalog } from "@/lib/catalog/data-source";
import { pruneStoredFiles } from "@/lib/storage/retention";
import type { Product } from "@/types/catalog";

const execFileAsync = promisify(execFile);

const STORAGE_DIR = path.join(process.cwd(), "storage");
const NEW_ARRIVALS_DIR = path.join(STORAGE_DIR, "new-arrivals");
const CURRENT_NEW_ARRIVALS_PATH = path.join(STORAGE_DIR, "current-new-arrivals.generated.json");
const STORED_NEW_ARRIVAL_LIST_LIMIT = 30;

interface ParsedNewArrivalProduct {
  title: string;
  article: string | null;
}

interface ParsedNewArrivalCatalog {
  products: ParsedNewArrivalProduct[];
}

export interface MissingNewArrivalProduct {
  title: string;
  article: string | null;
}

export interface NewArrivalsState {
  sourceFileName: string;
  importedAt: string;
  sourceProductCount: number;
  matchedCount: number;
  missingCount: number;
  slugs: string[];
  missingProducts: MissingNewArrivalProduct[];
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "") || "new-arrivals.xlsx";
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

function normalizeArticle(value: string | null | undefined) {
  return normalizeText(value).toUpperCase();
}

function buildProductIndexes(products: Product[]) {
  const byArticle = new Map<string, Product>();
  const byTitle = new Map<string, Product>();

  for (const product of products) {
    const article = normalizeArticle(product.article);
    const title = normalizeText(product.title);

    if (article) {
      byArticle.set(article, product);
    }

    if (title) {
      byTitle.set(title, product);
    }
  }

  return { byArticle, byTitle };
}

function findProduct(
  sourceProduct: ParsedNewArrivalProduct,
  indexes: ReturnType<typeof buildProductIndexes>
) {
  const article = normalizeArticle(sourceProduct.article);

  if (article) {
    const product = indexes.byArticle.get(article);

    if (product) {
      return product;
    }
  }

  return indexes.byTitle.get(normalizeText(sourceProduct.title)) ?? null;
}

async function readCurrentNewArrivals(): Promise<NewArrivalsState | null> {
  try {
    const raw = await readFile(CURRENT_NEW_ARRIVALS_PATH, "utf-8");
    return JSON.parse(raw) as NewArrivalsState;
  } catch {
    return null;
  }
}

export async function getNewArrivalsState(): Promise<NewArrivalsState> {
  const state = await readCurrentNewArrivals();

  return state ?? {
    sourceFileName: "Не загружено",
    importedAt: "",
    sourceProductCount: 0,
    matchedCount: 0,
    missingCount: 0,
    slugs: [],
    missingProducts: []
  };
}

export async function getCurrentNewArrivalSlugs(): Promise<string[]> {
  return (await getNewArrivalsState()).slugs;
}

export function getAdminNewArrivalsImportToken() {
  return (
    process.env.ADMIN_NEW_ARRIVALS_IMPORT_TOKEN?.trim() ??
    process.env.ADMIN_PRICE_IMPORT_TOKEN?.trim() ??
    ""
  );
}

export async function importNewArrivalsFromBuffer(fileName: string, content: Buffer): Promise<NewArrivalsState> {
  await mkdir(NEW_ARRIVALS_DIR, { recursive: true });
  await mkdir(STORAGE_DIR, { recursive: true });

  const safeName = sanitizeFilename(fileName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const datedName = `${timestamp}-${safeName}`;
  const storedSourcePath = path.join(NEW_ARRIVALS_DIR, datedName);
  const parsedOutputPath = path.join(NEW_ARRIVALS_DIR, `${timestamp}-parsed.json`);

  await writeFile(storedSourcePath, content);
  await pruneStoredFiles(NEW_ARRIVALS_DIR, STORED_NEW_ARRIVAL_LIST_LIMIT);

  await execFileAsync("python3", [
    path.join(process.cwd(), "scripts", "import_price_list.py"),
    storedSourcePath,
    "--source-display-name",
    fileName,
    "--output",
    parsedOutputPath,
    "--copy-price-list-to",
    ""
  ]);

  const parsedRaw = await readFile(parsedOutputPath, "utf-8");
  const parsedCatalog = JSON.parse(parsedRaw) as ParsedNewArrivalCatalog;
  await unlink(parsedOutputPath).catch(() => undefined);

  const currentCatalog = await getRuntimeCatalog();
  const indexes = buildProductIndexes(currentCatalog.products);
  const slugs: string[] = [];
  const seenSlugs = new Set<string>();
  const missingProducts: MissingNewArrivalProduct[] = [];

  for (const sourceProduct of parsedCatalog.products) {
    const product = findProduct(sourceProduct, indexes);

    if (!product) {
      missingProducts.push({
        title: sourceProduct.title,
        article: sourceProduct.article
      });
      continue;
    }

    if (!seenSlugs.has(product.slug)) {
      seenSlugs.add(product.slug);
      slugs.push(product.slug);
    }
  }

  const state: NewArrivalsState = {
    sourceFileName: fileName,
    importedAt: new Date().toISOString(),
    sourceProductCount: parsedCatalog.products.length,
    matchedCount: slugs.length,
    missingCount: missingProducts.length,
    slugs,
    missingProducts
  };

  await writeFile(CURRENT_NEW_ARRIVALS_PATH, JSON.stringify(state, null, 2) + "\n", "utf-8");

  return state;
}
