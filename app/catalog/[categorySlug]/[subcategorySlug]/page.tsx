import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogShell } from "@/components/catalog/catalog-shell";
import { resolveCatalogSearchParams, type RawSearchParams } from "@/lib/catalog/page-state";
import { getCatalogResult, getSectionBySlug, getSections, getSubcategory } from "@/lib/catalog/service";

interface SubcategoryPageProps {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function generateStaticParams() {
  return getSections().flatMap((section) =>
    section.subcategories.map((subcategory) => ({
      categorySlug: section.slug,
      subcategorySlug: subcategory.slug
    }))
  );
}

export async function generateMetadata({ params }: SubcategoryPageProps): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;
  const section = getSectionBySlug(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);

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
  const section = getSectionBySlug(categorySlug);
  const subcategory = getSubcategory(categorySlug, subcategorySlug);

  if (!section || !subcategory) {
    notFound();
  }

  const { query, page } = await resolveCatalogSearchParams(searchParams);
  const result = await getCatalogResult({ categorySlug, subcategorySlug, query, page });

  return (
    <CatalogShell
      title={subcategory.title}
      description={subcategory.description}
      result={result}
      query={query}
      activeCategorySlug={section.slug}
      activeSubcategorySlug={subcategory.slug}
      activeCategoryTitle={section.title}
      activeSubcategoryTitle={subcategory.title}
    />
  );
}
