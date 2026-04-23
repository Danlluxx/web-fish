import "server-only";

import type { Product } from "@/types/catalog";
import {
  MANUAL_PRODUCT_MEDIA_MAP,
  buildMediaItems,
  type ProductMedia,
  resolveProductArticle
} from "@/lib/catalog/media";
import { getRuntimeProductMediaByArticle } from "@/lib/catalog/media-data";

export async function getMappedProductMedia(
  product: Pick<Product, "slug" | "title" | "article">
): Promise<ProductMedia[] | null> {
  const manualMedia = MANUAL_PRODUCT_MEDIA_MAP[product.slug];

  if (manualMedia) {
    return manualMedia;
  }

  const normalizedArticle = resolveProductArticle(product);

  if (!normalizedArticle) {
    return null;
  }

  const articleMedia = await getRuntimeProductMediaByArticle(normalizedArticle);

  if (articleMedia?.length) {
    return buildMediaItems(articleMedia, product.title);
  }

  return null;
}

function buildFallbackMedia(product: Pick<Product, "slug" | "title">): ProductMedia[] {
  return [
    {
      src: `/api/product-image/${product.slug}`,
      alt: product.title
    }
  ];
}

export async function getProductMedia(
  product: Pick<Product, "slug" | "title" | "article">
): Promise<ProductMedia[]> {
  return (await getMappedProductMedia(product)) ?? buildFallbackMedia(product);
}

export async function getPrimaryMappedProductMedia(
  product: Pick<Product, "slug" | "title" | "article">
): Promise<ProductMedia | null> {
  return (await getMappedProductMedia(product))?.[0] ?? null;
}
