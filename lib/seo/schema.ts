import { siteConfig } from "@/lib/site";
import type { Product } from "@/types/catalog";

interface BreadcrumbSchemaItem {
  label: string;
  href?: string;
}

function toAbsoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${siteConfig.siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.siteUrl}/#organization`,
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    logo: toAbsoluteUrl("/images/branding/vs-o-rybkah-logo.webp"),
    telephone: siteConfig.phoneLabel,
    sameAs: [siteConfig.telegramUrl, siteConfig.maxUrl]
  };
}

export function buildBreadcrumbListSchema(items: BreadcrumbSchemaItem[]) {
  const itemListElement = items.map((item, index) => {
    const payload: Record<string, unknown> = {
      "@type": "ListItem",
      position: index + 1,
      name: item.label
    };

    if (item.href) {
      payload.item = toAbsoluteUrl(item.href);
    }

    return payload;
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement
  };
}

export function buildProductSchema(product: Product, media: Array<{ src: string; alt: string }>) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${siteConfig.siteUrl}/products/${product.slug}#product`,
    name: product.title,
    description: product.summary || product.description,
    category: product.subcategory ? `${product.category} / ${product.subcategory}` : product.category,
    sku: product.article ?? product.id,
    brand: {
      "@type": "Brand",
      name: siteConfig.name
    },
    image: media.map((item) => toAbsoluteUrl(item.src)),
    url: `${siteConfig.siteUrl}/products/${product.slug}`
  };

  if (product.price !== null) {
    schema.offers = {
      "@type": "Offer",
      price: String(product.price),
      priceCurrency: "RUB",
      url: `${siteConfig.siteUrl}/products/${product.slug}`
    };
  }

  return schema;
}
