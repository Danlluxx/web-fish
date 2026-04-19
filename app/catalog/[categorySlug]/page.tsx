import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogShell } from "@/components/catalog/catalog-shell";
import { resolveCatalogSearchParams, type RawSearchParams } from "@/lib/catalog/page-state";
import { getCatalogResult, getSectionBySlug, getSections } from "@/lib/catalog/service";

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const section = await getSectionBySlug(categorySlug);

  if (!section) {
    return {};
  }

  return {
    title: section.title,
    description: section.description
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { categorySlug } = await params;
  const section = await getSectionBySlug(categorySlug);

  if (!section) {
    notFound();
  }

  const { query, page } = await resolveCatalogSearchParams(searchParams);
  const result = await getCatalogResult({ categorySlug, query, page });

  return (
    <CatalogShell
      title={section.title}
      description={section.description}
      result={result}
      query={query}
      activeCategorySlug={section.slug}
      activeCategoryTitle={section.title}
    />
  );
}
