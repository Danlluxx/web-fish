import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { Pagination } from "@/components/catalog/pagination";
import { ProductCard } from "@/components/catalog/product-card";
import { buildCatalogPath } from "@/lib/catalog/urls";
import { formatCount } from "@/lib/catalog/utils";
import type { CatalogResult, FilterOption } from "@/types/catalog";

interface CatalogShellProps {
  title: string;
  description: string;
  result: CatalogResult;
  query?: string;
  activeCategorySlug?: string;
  activeSubcategorySlug?: string;
  activeCategoryTitle?: string;
  activeSubcategoryTitle?: string;
}

function buildHref(basePath: string, query?: string): string {
  if (!query) {
    return basePath;
  }

  const params = new URLSearchParams({ q: query });
  return `${basePath}?${params.toString()}`;
}

function FilterPills({
  label,
  items,
  activeSlug,
  buildItemHref,
  allHref,
  allLabel
}: {
  label: string;
  items: FilterOption[];
  activeSlug?: string;
  buildItemHref: (slug: string) => string;
  allHref: string;
  allLabel: string;
}) {
  return (
    <div className="filter-group">
      <div className="filter-group__label">{label}</div>
      <div className="filter-pills">
        <Link href={allHref} className={`filter-pill ${!activeSlug ? "is-active" : ""}`}>
          {allLabel}
        </Link>

        {items.map((item) => (
          <Link
            key={item.slug}
            href={buildItemHref(item.slug)}
            className={`filter-pill ${activeSlug === item.slug ? "is-active" : ""}`}
          >
            <span>{item.title}</span>
            <small>{item.count}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CatalogShell({
  title,
  description,
  result,
  query,
  activeCategorySlug,
  activeSubcategorySlug,
  activeCategoryTitle,
  activeSubcategoryTitle
}: CatalogShellProps) {
  const basePath = buildCatalogPath(activeCategorySlug, activeSubcategorySlug);
  const breadcrumbItems = [
    { label: "Главная", href: "/" },
    { label: "Каталог", href: "/catalog" },
    activeCategoryTitle
      ? { label: activeCategoryTitle, href: buildCatalogPath(activeCategorySlug) }
      : null,
    activeSubcategoryTitle ? { label: activeSubcategoryTitle } : null
  ].filter(Boolean) as { label: string; href?: string }[];

  return (
    <div className="catalog-layout">
      <section className="catalog-hero">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="catalog-hero__header">
          <div>
            <span className="eyebrow">Каталог продукции</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          <div className="catalog-hero__stats">
            <div>
              <strong>{formatCount(result.total)}</strong>
              <span>товаров по текущему фильтру</span>
            </div>
            <div>
              <strong>{formatCount(result.categoryOptions.length)}</strong>
              <span>категорий в каталоге</span>
            </div>
          </div>
        </div>

        <form action={basePath} method="get" className="catalog-search">
          <label className="sr-only" htmlFor="catalog-search-input">
            Поиск по каталогу
          </label>
          <input
            id="catalog-search-input"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Поиск по названию, категории или подкатегории"
          />
          <button type="submit" className="button button--primary">
            Найти
          </button>
        </form>

        <div className="filter-stack">
          <FilterPills
            label="Категории"
            items={result.categoryOptions}
            activeSlug={activeCategorySlug}
            allHref={buildHref("/catalog", query)}
            allLabel="Все категории"
            buildItemHref={(slug) => buildHref(buildCatalogPath(slug), query)}
          />

          {activeCategorySlug ? (
            <FilterPills
              label="Подкатегории"
              items={result.subcategoryOptions}
              activeSlug={activeSubcategorySlug}
              allHref={buildHref(buildCatalogPath(activeCategorySlug), query)}
              allLabel="Все подкатегории"
              buildItemHref={(slug) => buildHref(buildCatalogPath(activeCategorySlug, slug), query)}
            />
          ) : null}
        </div>
      </section>

      <section className="catalog-grid-section">
        <div className="catalog-grid-section__header">
          <h2>Карточки товаров</h2>
          <p>
            Компактная сетка, быстрый поиск и переход к
            детальной карточке товара без лишних шагов.
          </p>
        </div>

        {result.items.length > 0 ? (
          <div className="product-grid">
            {result.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>По вашему запросу ничего не найдено</h3>
            <p>Попробуйте сократить запрос или сбросить часть фильтров, чтобы увидеть больше товаров.</p>
            <Link href="/catalog" className="button button--secondary">
              Сбросить фильтры
            </Link>
          </div>
        )}

        <Pagination basePath={basePath} page={result.page} totalPages={result.totalPages} query={query} />
      </section>
    </div>
  );
}
