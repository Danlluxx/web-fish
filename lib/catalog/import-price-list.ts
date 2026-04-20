import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

import { getRuntimeCatalogMeta } from "@/lib/catalog/data-source";

const execFileAsync = promisify(execFile);

const STORAGE_DIR = path.join(process.cwd(), "storage");
const PRICE_LISTS_DIR = path.join(STORAGE_DIR, "price-lists");
const CURRENT_PRICE_PATH = path.join(STORAGE_DIR, "current-price.xlsx");
const CURRENT_CATALOG_PATH = path.join(STORAGE_DIR, "current-catalog.generated.json");

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
}

export async function importPriceListFromBuffer(fileName: string, content: Buffer): Promise<ImportedPriceListResult> {
  await mkdir(PRICE_LISTS_DIR, { recursive: true });
  await mkdir(STORAGE_DIR, { recursive: true });

  const safeName = sanitizeFilename(fileName);
  const datedName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${safeName}`;
  const storedSourcePath = path.join(PRICE_LISTS_DIR, datedName);

  await writeFile(storedSourcePath, content);

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

  return getRuntimeCatalogMeta();
}

export function getCurrentPriceStoragePath() {
  return CURRENT_PRICE_PATH;
}

export function getAdminImportToken() {
  return process.env.ADMIN_PRICE_IMPORT_TOKEN?.trim() ?? "";
}
