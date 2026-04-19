export interface CatalogSection {
  title: string;
  slug: string;
  description: string;
  accent: string;
  subcategories: CatalogSubcategory[];
}

export interface CatalogSubcategory {
  title: string;
  slug: string;
  description: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  article: string | null;
  price: number | null;
  category: string;
  categorySlug: string;
  subcategory: string;
  subcategorySlug: string;
  summary: string;
  description: string;
  tags: string[];
  keywords: string[];
  imageAccent: string;
  updatedAt: string;
}

export interface CatalogFilters {
  query?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  page?: number;
  pageSize?: number;
}

export interface FilterOption {
  title: string;
  slug: string;
  count: number;
}

export interface CatalogResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categoryOptions: FilterOption[];
  subcategoryOptions: FilterOption[];
}
