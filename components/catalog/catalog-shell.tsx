import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { Pagination } from "@/components/catalog/pagination";
import { ProductCard } from "@/components/catalog/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { buildCatalogPath } from "@/lib/catalog/urls";
import { buildBreadcrumbListSchema } from "@/lib/seo/schema";
import { formatCount } from "@/lib/catalog/utils";
import type { CatalogResult, CatalogSort, FilterOption } from "@/types/catalog";

interface CatalogShellProps {
  title: string;
  description: string;
  result: CatalogResult;
  query?: string;
  sort?: CatalogSort;
  activeCategorySlug?: string;
  activeSubcategorySlug?: string;
  activeCategoryTitle?: string;
  activeSubcategoryTitle?: string;
}

const sortOptions: { value: CatalogSort; label: string }[] = [
  { value: "price-asc", label: "Цена: дешевые выше" },
  { value: "price-desc", label: "Цена: дорогие выше" }
];

function buildHref(basePath: string, query?: string, sort?: CatalogSort): string {
  if (!query && !sort) {
    return basePath;
  }

  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (sort) {
    params.set("sort", sort);
  }

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
  label?: string;
  items: FilterOption[];
  activeSlug?: string;
  buildItemHref: (slug: string) => string;
  allHref: string;
  allLabel: string;
}) {
  return (
    <div className="filter-group">
      {label ? <div className="filter-group__label">{label}</div> : null}
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
  sort,
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
    activeSubcategoryTitle
      ? { label: activeSubcategoryTitle, href: buildCatalogPath(activeCategorySlug, activeSubcategorySlug) }
      : null
  ].filter(Boolean) as { label: string; href?: string }[];
  const breadcrumbSchema = buildBreadcrumbListSchema(breadcrumbItems);
  const breadcrumbUiItems = breadcrumbItems.map((item, index) => ({
    label: item.label,
    href: index === breadcrumbItems.length - 1 ? undefined : item.href
  }));
  const activeSortLabel = sortOptions.find((option) => option.value === sort)?.label ?? "Сортировать по цене";

  return (
    <div className="catalog-layout">
      <JsonLd data={breadcrumbSchema} />
      <section className="catalog-hero">
        <Breadcrumbs items={breadcrumbUiItems} />
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
          {sort ? <input type="hidden" name="sort" value={sort} /> : null}
        </form>

        <div className="catalog-sort">
          <details className="catalog-sort-menu">
            <summary className="catalog-sort-menu__trigger" aria-label="Открыть сортировку товаров">
              <span className="catalog-sort-menu__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 7H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M5 12H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M5 17H11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <span>{activeSortLabel}</span>
            </summary>
            <div className="catalog-sort-menu__panel" aria-label="Сортировка товаров">
            {sortOptions.map((option) => (
              <Link
                key={option.value}
                href={buildHref(basePath, query, option.value)}
                className={`catalog-sort__option ${sort === option.value ? "is-active" : ""}`}
              >
                {option.label}
              </Link>
            ))}
            </div>
          </details>
        </div>

        <div className="filter-stack">
          {activeCategorySlug ? (
            <FilterPills
              label="Подкатегории"
              items={result.subcategoryOptions}
              activeSlug={activeSubcategorySlug}
              allHref={buildHref(buildCatalogPath(activeCategorySlug), query, sort)}
              allLabel="Все подкатегории"
              buildItemHref={(slug) => buildHref(buildCatalogPath(activeCategorySlug, slug), query, sort)}
            />
          ) : (
            <FilterPills
              items={result.categoryOptions}
              allHref={buildHref("/catalog", query, sort)}
              allLabel="Все категории"
              buildItemHref={(slug) => buildHref(buildCatalogPath(slug), query, sort)}
            />
          )}
        </div>
      </section>

      <section className="catalog-grid-section">
        <div className="catalog-grid-section__header">
          <h2>Карточки товаров</h2>
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

        <Pagination basePath={basePath} page={result.page} totalPages={result.totalPages} query={query} sort={sort} />
      </section>
    </div>
  );
}
