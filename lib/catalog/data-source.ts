import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

import type { CatalogSection, Product } from "@/types/catalog";

export interface CatalogMeta {
  catalogTitle: string;
  sourceFileName: string;
  importedAt: string;
  productCount: number;
  previousSourceFileName?: string;
  previousImportedAt?: string;
  newArrivalCount?: number;
  newArrivalSlugs?: string[];
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

interface RuntimeCatalog {
  meta: CatalogMeta;
  sections: CatalogSection[];
  products: Product[];
}

const STORAGE_CATALOG_PATH = path.join(process.cwd(), "storage", "current-catalog.generated.json");
const FALLBACK_CATALOG_PATH = path.join(process.cwd(), "data", "catalog.generated.json");
const CATEGORY_ACCENTS: Record<string, string> = {
  ryby: "#3B82F6",
  amfibii: "#60A5FA",
  bespozvonochnye: "#2563EB",
  rasteniya: "#93C5FD"
};
const FALLBACK_ACCENT = "#3B82F6";

let cache:
  | {
      path: string;
      mtimeMs: number;
      data: RuntimeCatalog;
    }
  | null = null;

async function resolveCatalogPath(): Promise<string> {
  try {
    await access(STORAGE_CATALOG_PATH);
    return STORAGE_CATALOG_PATH;
  } catch {
    return FALLBACK_CATALOG_PATH;
  }
}

function resolveAccent(slug: string): string {
  return CATEGORY_ACCENTS[slug] ?? FALLBACK_ACCENT;
}

function normalizeCatalog(sourceCatalog: GeneratedCatalog): RuntimeCatalog {
  return {
    meta: sourceCatalog.meta,
    sections: sourceCatalog.sections.map((section) => ({
      ...section,
      accent: resolveAccent(section.slug)
    })),
    products: sourceCatalog.products.map((product) => ({
      ...product,
      imageAccent: resolveAccent(product.categorySlug)
    }))
  };
}

export async function getRuntimeCatalog(): Promise<RuntimeCatalog> {
  const catalogPath = await resolveCatalogPath();
  const stats = await stat(catalogPath);

  if (cache && cache.path === catalogPath && cache.mtimeMs === stats.mtimeMs) {
    return cache.data;
  }

  const raw = await readFile(catalogPath, "utf-8");
  const parsed = JSON.parse(raw) as GeneratedCatalog;
  const data = normalizeCatalog(parsed);

  cache = {
    path: catalogPath,
    mtimeMs: stats.mtimeMs,
    data
  };

  return data;
}

export async function getRuntimeCatalogMeta() {
  return (await getRuntimeCatalog()).meta;
}

export async function getRuntimeCatalogSections(): Promise<CatalogSection[]> {
  return (await getRuntimeCatalog()).sections;
}

export async function getRuntimeCatalogProducts(): Promise<Product[]> {
  return (await getRuntimeCatalog()).products;
}
