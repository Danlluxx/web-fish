import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ProductCard } from "@/components/catalog/product-card";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { FavoriteToggleButton } from "@/components/favorites/favorite-toggle-button";
import { getProductMedia } from "@/lib/catalog/media";
import { formatPrice } from "@/lib/price";
import { buildCatalogPath } from "@/lib/catalog/urls";
import { siteConfig } from "@/lib/site";
import type { Product } from "@/types/catalog";

interface ProductDetailProps {
  product: Product;
  similarProducts: Product[];
}

export function ProductDetail({ product, similarProducts }: ProductDetailProps) {
  const detailTags = Array.from(new Set(product.tags.concat(product.keywords.slice(0, 2))));
  const media = getProductMedia(product);
  const primaryMedia = media[0];
  const galleryMedia = media.slice(1);

  return (
    <div className="product-detail-layout">
      <section className="product-detail">
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Каталог", href: "/catalog" },
            {
              label: product.category,
              href: buildCatalogPath(product.categorySlug)
            },
            {
              label: product.subcategory,
              href: buildCatalogPath(product.categorySlug, product.subcategorySlug)
            },
            { label: product.title }
          ]}
        />

        <div className="product-detail__grid">
          <div className="product-visual">
            <img src={primaryMedia.src} alt={primaryMedia.alt} className="product-visual__image" />
            {galleryMedia.length > 0 ? (
              <div className="product-visual__gallery">
                {galleryMedia.map((item) => (
                  <img key={item.src} src={item.src} alt={item.alt} className="product-visual__thumb" />
                ))}
              </div>
            ) : null}
          </div>

          <div className="product-summary-card">
            <span className="eyebrow">Карточка товара</span>
            <h1>{product.title}</h1>
            <div className="product-summary-card__price-block">
              <span>Цена</span>
              <strong>{formatPrice(product.price)}</strong>
            </div>
            <p>{product.description}</p>

            <dl className="product-attributes">
              <div>
                <dt>Категория</dt>
                <dd>{product.category}</dd>
              </div>
              <div>
                <dt>Подкатегория</dt>
                <dd>{product.subcategory}</dd>
              </div>
              <div>
                <dt>Обновлено</dt>
                <dd>{product.updatedAt}</dd>
              </div>
              <div className="product-attributes__item product-attributes__item--article">
                <dt>Артикул</dt>
                <dd>{product.article ?? "Не указан"}</dd>
              </div>
            </dl>

            <div className="tag-row">
              {detailTags.map((tag) => (
                <span className="tag-chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>

            <div className="product-summary-card__actions">
              <Link href={buildCatalogPath(product.categorySlug, product.subcategorySlug)} className="button button--secondary">
                Вернуться в каталог
              </Link>
              <a href={siteConfig.priceListHref} target="_blank" rel="noreferrer" className="button button--primary">
                Посмотреть прайс в Excel
              </a>
              <AddToCartButton productSlug={product.slug} productTitle={product.title} variant="detail" />
              <FavoriteToggleButton
                productSlug={product.slug}
                productTitle={product.title}
                variant="detail"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="related-products">
        <div className="section-header">
          <div>
            <span className="eyebrow">Похожие товары</span>
            <h2>Позиции из близкой категории</h2>
          </div>
          <Link href={buildCatalogPath(product.categorySlug)} className="section-link">
            Перейти в категорию
          </Link>
        </div>

        <div className="product-grid">
          {similarProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
