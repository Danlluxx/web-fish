import type { MetadataRoute } from "next";

import { getAllProducts, getSections } from "@/lib/catalog/service";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sections = getSections();
  const products = await getAllProducts();

  return [
    {
      url: `${siteConfig.siteUrl}/`,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteConfig.siteUrl}/catalog`,
      changeFrequency: "daily",
      priority: 0.9
    },
    ...sections.map((section) => ({
      url: `${siteConfig.siteUrl}/catalog/${section.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...sections.flatMap((section) =>
      section.subcategories.map((subcategory) => ({
        url: `${siteConfig.siteUrl}/catalog/${section.slug}/${subcategory.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.75
      }))
    ),
    ...products.map((product) => ({
      url: `${siteConfig.siteUrl}/products/${product.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.65
    }))
  ];
}
