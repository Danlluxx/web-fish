import sourceCatalog from "@/data/catalog.generated.json";
import type { CatalogSection, Product } from "@/types/catalog";

interface GeneratedCatalog {
  meta: {
    catalogTitle: string;
    sourceFileName: string;
    importedAt: string;
    productCount: number;
  };
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

const catalog = sourceCatalog as GeneratedCatalog;

const CATEGORY_ACCENTS: Record<string, string> = {
  ryby: "#3B82F6",
  amfibii: "#60A5FA",
  bespozvonochnye: "#2563EB",
  rasteniya: "#93C5FD"
};

const FALLBACK_ACCENT = "#3B82F6";

function resolveAccent(slug: string): string {
  return CATEGORY_ACCENTS[slug] ?? FALLBACK_ACCENT;
}

export const CATALOG_META = catalog.meta;

export const CATALOG_SECTIONS: CatalogSection[] = catalog.sections.map((section) => ({
  ...section,
  accent: resolveAccent(section.slug)
}));

export const PRODUCTS: Product[] = catalog.products.map((product) => ({
  ...product,
  imageAccent: resolveAccent(product.categorySlug)
}));
