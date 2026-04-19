import type { Metadata } from "next";

import { FavoritesPageClient } from "@/components/favorites/favorites-page-client";
import { getAllProducts } from "@/lib/catalog/service";

export const metadata: Metadata = {
  title: "Избранное",
  description: "Список сохраненных товаров AquaMarket."
};

export default async function FavoritesPage() {
  const products = await getAllProducts();

  return <FavoritesPageClient products={products} />;
}
