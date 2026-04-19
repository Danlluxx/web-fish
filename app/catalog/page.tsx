import type { Metadata } from "next";

import { CatalogShell } from "@/components/catalog/catalog-shell";
import { resolveCatalogSearchParams, type RawSearchParams } from "@/lib/catalog/page-state";
import { getCatalogResult } from "@/lib/catalog/service";

interface CatalogPageProps {
  searchParams: Promise<RawSearchParams>;
}

export const metadata: Metadata = {
  title: "Каталог товаров",
  description: "Общий каталог товаров с поиском, фильтрацией по категориям и отдельными карточками."
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { query, page } = await resolveCatalogSearchParams(searchParams);
  const result = await getCatalogResult({ query, page });

  return (
    <CatalogShell
      title="Каталог товаров"
      description="Общий список товаров с быстрым поиском по названию, категории и подкатегории."
      result={result}
      query={query}
    />
  );
}
