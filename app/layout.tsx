import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CartProvider } from "@/components/cart/cart-provider";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { getAllProducts } from "@/lib/catalog/service";
import { buildOrganizationSchema } from "@/lib/seo/schema";
import { siteConfig } from "@/lib/site";

import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} | Каталог товаров`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const products = await getAllProducts();
  const validSlugs = products.map((product) => product.slug);
  const organizationSchema = buildOrganizationSchema();

  return (
    <html lang="ru">
      <body>
        <JsonLd data={organizationSchema} />
        <FavoritesProvider validSlugs={validSlugs}>
          <CartProvider validSlugs={validSlugs}>
            <SiteHeader />
            <main className="shell main-shell">{children}</main>
            <SiteFooter />
          </CartProvider>
        </FavoritesProvider>
      </body>
    </html>
  );
}
