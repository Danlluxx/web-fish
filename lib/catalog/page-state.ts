import type { CatalogSort } from "@/types/catalog";

export type RawSearchParams = Record<string, string | string[] | undefined>;

function takeFirst(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export async function resolveCatalogSearchParams(
  input: Promise<RawSearchParams> | RawSearchParams
): Promise<{ query?: string; page: number; sort?: CatalogSort }> {
  const searchParams = await input;
  const query = takeFirst(searchParams.q)?.trim() || undefined;
  const sortValue = takeFirst(searchParams.sort);
  const sort = sortValue === "price-asc" || sortValue === "price-desc" ? sortValue : undefined;
  const pageValue = Number.parseInt(takeFirst(searchParams.page) ?? "1", 10);
  const page = Number.isNaN(pageValue) || pageValue < 1 ? 1 : pageValue;

  return { query, page, sort };
}
