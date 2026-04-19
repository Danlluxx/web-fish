"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ProductCard } from "@/components/catalog/product-card";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { buildCatalogPath } from "@/lib/catalog/urls";
import type { Product } from "@/types/catalog";

interface FavoritesPageClientProps {
  products: Product[];
}

export function FavoritesPageClient({ products }: FavoritesPageClientProps) {
  const { favorites, hasHydrated } = useFavorites();

  const favoriteProducts = useMemo(() => {
    const favoriteSet = new Set(favorites);
    return products.filter((product) => favoriteSet.has(product.slug));
  }, [favorites, products]);

  return (
    <div className="catalog-layout">
      <section className="catalog-hero">
        <div className="catalog-hero__header">
          <div>
            <span className="eyebrow">Избранное</span>
            <h1>Сохраненные товары</h1>
            <p>
              Здесь отображаются товары, которые вы отметили сердечком. Список хранится локально
              в браузере.
            </p>
          </div>

          <div className="catalog-hero__stats">
            <div>
              <strong>{favoriteProducts.length}</strong>
              <span>товаров в избранном</span>
            </div>
          </div>
        </div>
      </section>

      {hasHydrated && favoriteProducts.length > 0 ? (
        <section className="catalog-grid-section">
          <div className="product-grid">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : (
        <section className="empty-state empty-state--standalone">
          <h2>В избранном пока пусто</h2>
          <p>
            Добавьте товары сердечком из каталога или карточки товара, и они появятся на этой
            странице.
          </p>
          <Link href={buildCatalogPath("ryby")} className="button button--primary">
            Перейти к товарам
          </Link>
        </section>
      )}
    </div>
  );
}
