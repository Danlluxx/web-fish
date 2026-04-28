import { getRuntimeCatalog, getRuntimeCatalogSections } from "@/lib/catalog/data-source";
import { productRepository } from "@/lib/catalog/repository";
import { clamp, normalizeText } from "@/lib/catalog/utils";
import type {
  CatalogFilters,
  CatalogResult,
  CatalogSection,
  CatalogSubcategory,
  FilterOption,
  Product
} from "@/types/catalog";

const DEFAULT_PAGE_SIZE = 18;

function buildSearchableText(product: Product): string {
  return normalizeText(
    [
      product.title,
      product.article ?? "",
      product.category,
      product.subcategory,
      product.summary,
      product.description,
      product.tags.join(" "),
      product.keywords.join(" ")
    ].join(" ")
  );
}

function getSearchScore(product: Product, query: string): number {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const title = normalizeText(product.title);
  const article = normalizeText(product.article ?? "");
  const category = normalizeText(product.category);
  const subcategory = normalizeText(product.subcategory);
  const keywords = normalizeText(product.keywords.join(" "));
  const description = buildSearchableText(product);

  let score = 0;

  if (title.includes(normalizedQuery)) {
    score += 24;
  }

  if (article.includes(normalizedQuery)) {
    score += 18;
  }

  if (category.includes(normalizedQuery) || subcategory.includes(normalizedQuery)) {
    score += 10;
  }

  for (const token of tokens) {
    if (title.includes(token)) {
      score += 8;
    }

    if (article.includes(token)) {
      score += 7;
    }

    if (category.includes(token) || subcategory.includes(token)) {
      score += 5;
    }

    if (keywords.includes(token)) {
      score += 3;
    }

    if (description.includes(token)) {
      score += 1;
    }
  }

  return score;
}

function applyFilters(products: Product[], filters: CatalogFilters): Product[] {
  const { categorySlug, subcategorySlug, query } = filters;
  const normalizedQuery = query ? normalizeText(query) : "";

  let filtered = products;

  if (categorySlug) {
    filtered = filtered.filter((product) => product.categorySlug === categorySlug);
  }

  if (subcategorySlug) {
    filtered = filtered.filter((product) => product.subcategorySlug === subcategorySlug);
  }

  if (!normalizedQuery) {
    return filtered;
  }

  return filtered
    .map((product) => ({
      product,
      score: getSearchScore(product, normalizedQuery)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.product.title.localeCompare(right.product.title, "ru"))
    .map((entry) => entry.product);
}

function buildCategoryOptions(products: Product[], sections: CatalogSection[]): FilterOption[] {
  return sections.map((section) => ({
    title: section.title,
    slug: section.slug,
    count: products.filter((product) => product.categorySlug === section.slug).length
  })).filter((option) => option.count > 0);
}

function buildSubcategoryOptions(
  products: Product[],
  sections: CatalogSection[],
  categorySlug?: string
): FilterOption[] {
  const matchingSection = categorySlug
    ? sections.find((section) => section.slug === categorySlug)
    : null;

  const source = matchingSection
    ? matchingSection.subcategories
    : sections.flatMap((section) => section.subcategories);

  return source
    .map((subcategory) => ({
      title: subcategory.title,
      slug: subcategory.slug,
      count: products.filter((product) => product.subcategorySlug === subcategory.slug).length
    }))
    .filter((option) => option.count > 0);
}

export async function getCatalogResult(filters: CatalogFilters): Promise<CatalogResult> {
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const sections = await getRuntimeCatalogSections();
  const allProducts = await productRepository.getAll();
  const filteredProducts = applyFilters(allProducts, filters);
  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = clamp(filters.page ?? 1, 1, totalPages);
  const start = (page - 1) * pageSize;
  const items = filteredProducts.slice(start, start + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    categoryOptions: buildCategoryOptions(allProducts, sections),
    subcategoryOptions: buildSubcategoryOptions(
      allProducts.filter((product) =>
        filters.categorySlug ? product.categorySlug === filters.categorySlug : true
      ),
      sections,
      filters.categorySlug
    )
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return productRepository.getBySlug(slug);
}

export async function getAllProducts(): Promise<Product[]> {
  return productRepository.getAll();
}

export async function getNewArrivalProducts(limit = 8): Promise<{
  items: Product[];
  total: number;
}> {
  const catalog = await getRuntimeCatalog();
  const allProducts = catalog.products;
  const productMap = new Map(allProducts.map((product) => [product.slug, product]));
  const slugs = catalog.meta.newArrivalSlugs ?? [];

  const items = slugs
    .map((slug) => productMap.get(slug))
    .filter((product): product is Product => Boolean(product))
    .slice(0, limit);

  return {
    items,
    total: catalog.meta.newArrivalCount ?? items.length
  };
}

export async function getSimilarProducts(product: Product, limit = 4): Promise<Product[]> {
  const allProducts = await productRepository.getAll();

  return allProducts
    .filter((item) => item.slug !== product.slug)
    .sort((left, right) => {
      const leftScore =
        Number(left.subcategorySlug === product.subcategorySlug) * 4 +
        Number(left.categorySlug === product.categorySlug) * 2;
      const rightScore =
        Number(right.subcategorySlug === product.subcategorySlug) * 4 +
        Number(right.categorySlug === product.categorySlug) * 2;

      return rightScore - leftScore || left.title.localeCompare(right.title, "ru");
    })
    .slice(0, limit);
}

export async function getSections(): Promise<CatalogSection[]> {
  return getRuntimeCatalogSections();
}

export async function getSectionBySlug(slug: string): Promise<CatalogSection | null> {
  const sections = await getRuntimeCatalogSections();
  return sections.find((section) => section.slug === slug) ?? null;
}

export async function getSubcategory(
  sectionSlug: string,
  subcategorySlug: string
): Promise<CatalogSubcategory | null> {
  const sections = await getRuntimeCatalogSections();
  return (
    sections.find((section) => section.slug === sectionSlug)?.subcategories.find(
      (subcategory) => subcategory.slug === subcategorySlug
    ) ?? null
  );
}
