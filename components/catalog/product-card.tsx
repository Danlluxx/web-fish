import Link from "next/link";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { FavoriteToggleButton } from "@/components/favorites/favorite-toggle-button";
import { getPrimaryProductMedia } from "@/lib/catalog/media";
import { buildProductPath } from "@/lib/catalog/urls";
import type { Product } from "@/types/catalog";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = getPrimaryProductMedia(product);
  const productHref = buildProductPath(product.slug);

  return (
    <article className="product-card">
      <div className="product-card__head">
        <FavoriteToggleButton productSlug={product.slug} productTitle={product.title} />
      </div>

      <div className="product-card__media">
        <Link href={productHref} className="product-card__image-link">
          <img src={image.src} alt={image.alt} className="product-card__image" loading="lazy" />
        </Link>
      </div>

      <div className="product-card__body">
        <div className="product-card__meta">
          <span className="product-card__meta-chip">{product.category}</span>
        </div>

        <Link href={productHref} className="product-card__title">
          {product.title}
        </Link>

        <div className="product-card__footer">
          <Link href={productHref} className="product-card__cta">
            Открыть карточку
          </Link>
          <AddToCartButton productSlug={product.slug} productTitle={product.title} />
        </div>
      </div>
    </article>
  );
}
