import type { Product } from "@/types/catalog";

export interface ProductMedia {
  src: string;
  alt: string;
}

export const SHOWCASE_PRODUCT_SLUG = "ryby-labirintovye-terneciya-glofish-zolotaya-2-2-5-sm";
const PRODUCT_MEDIA_CACHE_VERSION = "20260423";
const TITLE_ARTICLE_PATTERN = /[\[(]([A-ZА-ЯЁa-zа-яё]{1,4}\s?\d{2,})[\])]\s*$/;

export const MANUAL_PRODUCT_MEDIA_MAP: Record<string, ProductMedia[]> = {
  [SHOWCASE_PRODUCT_SLUG]: [
    {
      src: "/images/products/terneciya-glofish-zolotaya-1.webp",
      alt: 'Тернеция "GloFish" золотая в аквариуме'
    },
    {
      src: "/images/products/terneciya-glofish-zolotaya-2.webp",
      alt: 'Тернеция "GloFish" золотая, второй ракурс'
    }
  ]
};

export function normalizeArticle(article: string | null | undefined): string | null {
  if (!article) {
    return null;
  }

  return article.replace(/\s+/g, "").toUpperCase();
}

export function resolveProductArticle(product: Pick<Product, "title" | "article">): string | null {
  const explicitArticle = normalizeArticle(product.article);

  if (explicitArticle) {
    return explicitArticle;
  }

  const titleArticle = product.title.match(TITLE_ARTICLE_PATTERN)?.[1];
  return normalizeArticle(titleArticle);
}

export function buildMediaItems(sources: string[], title: string): ProductMedia[] {
  return sources.map((src, index) => ({
    src,
    alt: index === 0 ? title : `${title} — фото ${index + 1}`
  }));
}

function buildArticlePrimaryMedia(article: string, title: string): ProductMedia {
  return {
    src: `/api/product-media/article/${encodeURIComponent(article)}?v=${PRODUCT_MEDIA_CACHE_VERSION}`,
    alt: title
  };
}

export function getPrimaryProductMedia(product: Pick<Product, "slug" | "title" | "article">): ProductMedia {
  const manualMedia = MANUAL_PRODUCT_MEDIA_MAP[product.slug]?.[0];

  if (manualMedia) {
    return manualMedia;
  }

  const normalizedArticle = resolveProductArticle(product);

  if (normalizedArticle) {
    return buildArticlePrimaryMedia(normalizedArticle, product.title);
  }

  return {
    src: `/api/product-image/${product.slug}`,
    alt: product.title
  };
}

export function getProductMedia(product: Pick<Product, "slug" | "title" | "article">): ProductMedia[] {
  return [getPrimaryProductMedia(product)];
}
