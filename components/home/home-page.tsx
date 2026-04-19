import Link from "next/link";

import { ProductCard } from "@/components/catalog/product-card";
import { HomeHeroGallery } from "@/components/home/home-hero-gallery";
import { buildCatalogPath } from "@/lib/catalog/urls";
import { siteConfig } from "@/lib/site";
import type { CatalogSection, Product } from "@/types/catalog";

interface HomePageProps {
  sections: CatalogSection[];
  featuredProducts: Product[];
  totalProducts: number;
  totalSubcategories: number;
}

export function HomePage({
  sections,
  featuredProducts,
  totalProducts,
  totalSubcategories
}: HomePageProps) {
  return (
    <div className="home-layout">
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <HomeHeroGallery />

          <div className="hero-panel__actions">
            <Link href="/catalog" className="button button--primary">
              Открыть каталог
            </Link>
            <a href={siteConfig.priceListHref} className="button button--secondary" target="_blank" rel="noreferrer">
              {siteConfig.priceListLabel}
            </a>
          </div>
        </div>

        <div className="hero-panel__stats">
          <div className="metric-card">
            <strong>{totalProducts} позиций</strong>
            <span>Очень широкий ассортимент позиций, начиная с самых базовых, заканчивая самыми редкими.</span>
          </div>
          <div className="metric-card">
            <strong>{sections.length} категории</strong>
            <span>Каталог делится по основным категориям товаров, чтобы вам было удобно ориентироваться.</span>
          </div>
          <div className="metric-card">
            <strong>{totalSubcategories} подкатегорий</strong>
            <span>Внутри каждой категории находятся подкатегории, для более детальной навигации.</span>
          </div>
        </div>
      </section>

      <section className="category-overview">
        <div className="section-header">
          <div>
            <span className="eyebrow">Структура каталога</span>
            <h2>Категории и подкатегории</h2>
          </div>
          <Link href="/catalog" className="section-link">
            Смотреть весь каталог
          </Link>
        </div>

        <div className="category-grid">
          {sections.map((section) => (
            <article className="category-card" key={section.slug}>
              <span className="category-card__accent" style={{ backgroundColor: section.accent }} />
              <h3>{section.title}</h3>
              <p>{section.description}</p>
              <div className="tag-row">
                {section.subcategories.map((subcategory) => (
                  <Link
                    href={
                      subcategory.slug === section.slug
                        ? buildCatalogPath(section.slug)
                        : buildCatalogPath(section.slug, subcategory.slug)
                    }
                    className="tag-chip tag-chip--link"
                    key={subcategory.slug}
                  >
                    {subcategory.title}
                  </Link>
                ))}
              </div>
              <Link href={buildCatalogPath(section.slug)} className="category-card__link">
                Перейти в категорию
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="featured-products">
        <div className="section-header">
          <div>
            <span className="eyebrow">Превью каталога</span>
            <h2>Пример карточек товаров</h2>
          </div>
          <Link href="/catalog" className="section-link">
            Все товары
          </Link>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
