import type { Product } from "@/types/catalog";
import productMediaManifest from "@/data/product-media.generated.json";

export interface ProductMedia {
  src: string;
  alt: string;
}

export const SHOWCASE_PRODUCT_SLUG = "ryby-labirintovye-terneciya-glofish-zolotaya-2-2-5-sm";

const PRODUCT_MEDIA_MAP: Record<string, ProductMedia[]> = {
  [SHOWCASE_PRODUCT_SLUG]: [
    {
      src: "/images/products/terneciya-glofish-zolotaya-1.jpg",
      alt: 'Тернеция "GloFish" золотая в аквариуме'
    },
    {
      src: "/images/products/terneciya-glofish-zolotaya-2.jpg",
      alt: 'Тернеция "GloFish" золотая, второй ракурс'
    }
  ]
};

const GENERATED_PRODUCT_MEDIA_MAP = (productMediaManifest.articles ?? {}) as Record<string, string[]>;

function normalizeArticle(article: string | null | undefined): string | null {
  if (!article) {
    return null;
  }

  return article.replace(/\s+/g, "").toUpperCase();
}

function buildMediaItems(sources: string[], title: string): ProductMedia[] {
  return sources.map((src, index) => ({
    src,
    alt: index === 0 ? title : `${title} — фото ${index + 1}`
  }));
}

export function getMappedProductMedia(product: Pick<Product, "slug" | "title" | "article">): ProductMedia[] | null {
  const normalizedArticle = normalizeArticle(product.article);

  if (normalizedArticle) {
    const articleMedia = GENERATED_PRODUCT_MEDIA_MAP[normalizedArticle];

    if (articleMedia?.length) {
      return buildMediaItems(articleMedia, product.title);
    }
  }

  return PRODUCT_MEDIA_MAP[product.slug] ?? null;
}

function buildFallbackMedia(product: Pick<Product, "slug" | "title">): ProductMedia[] {
  return [
    {
      src: `/api/product-image/${product.slug}`,
      alt: product.title
    }
  ];
}

export function getProductMedia(product: Pick<Product, "slug" | "title" | "article">): ProductMedia[] {
  return getMappedProductMedia(product) ?? buildFallbackMedia(product);
}

export function getPrimaryProductMedia(product: Pick<Product, "slug" | "title" | "article">): ProductMedia {
  return getProductMedia(product)[0];
}

export function getPrimaryMappedProductMedia(product: Pick<Product, "slug" | "title" | "article">): ProductMedia | null {
  return getMappedProductMedia(product)?.[0] ?? null;
}
