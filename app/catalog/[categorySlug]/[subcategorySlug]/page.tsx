import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogShell } from "@/components/catalog/catalog-shell";
import { resolveCatalogSearchParams, type RawSearchParams } from "@/lib/catalog/page-state";
import { getCatalogResult, getSectionBySlug, getSections, getSubcategory } from "@/lib/catalog/service";

interface SubcategoryPageProps {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateMetadata({ params }: SubcategoryPageProps): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;
  const section = await getSectionBySlug(categorySlug);
  const subcategory = await getSubcategory(categorySlug, subcategorySlug);

  if (!section || !subcategory) {
    return {};
  }

  return {
    title: `${subcategory.title} | ${section.title}`,
    description: subcategory.description
  };
}

export default async function SubcategoryPage({ params, searchParams }: SubcategoryPageProps) {
  const { categorySlug, subcategorySlug } = await params;
  const section = await getSectionBySlug(categorySlug);
  const subcategory = await getSubcategory(categorySlug, subcategorySlug);

  if (!section || !subcategory) {
    notFound();
  }

  const { query, page, sort } = await resolveCatalogSearchParams(searchParams);
  const result = await getCatalogResult({ categorySlug, subcategorySlug, query, page, sort });

  return (
    <CatalogShell
      title={subcategory.title}
      description={subcategory.description}
      result={result}
      query={query}
      sort={sort}
      activeCategorySlug={section.slug}
      activeSubcategorySlug={subcategory.slug}
      activeCategoryTitle={section.title}
      activeSubcategoryTitle={subcategory.title}
    />
  );
}
