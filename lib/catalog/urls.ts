export function buildCatalogPath(categorySlug?: string, subcategorySlug?: string): string {
  if (categorySlug && subcategorySlug) {
    return `/catalog/${categorySlug}/${subcategorySlug}`;
  }

  if (categorySlug) {
    return `/catalog/${categorySlug}`;
  }

  return "/catalog";
}

export function buildProductPath(slug: string): string {
  return `/products/${slug}`;
}
