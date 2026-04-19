import Image from "next/image";
import Link from "next/link";

import { CartLink } from "@/components/cart/cart-link";
import { FavoritesLink } from "@/components/favorites/favorites-link";
import { HeaderCategoriesNav } from "@/components/shared/header-categories-nav";
import { getSections } from "@/lib/catalog/service";
import { siteConfig } from "@/lib/site";

export function SiteHeader() {
  const sections = getSections();
  const sectionOrder = ["rasteniya", "amfibii", "bespozvonochnye", "ryby"] as const;
  const orderedSections = sectionOrder
    .map((slug) => sections.find((section) => section.slug === slug))
    .filter((section): section is (typeof sections)[number] => Boolean(section));
  const searchPlaceholder =
    sections.length > 0 ? `Искать товары, например ${sections[0].title.toLowerCase()}` : "Искать товары";

  return (
    <header className="site-header">
      <div className="site-header__utility">
        <div className="shell site-header__utility-inner">
          <div className="site-header__utility-actions">
            <a href={siteConfig.phoneHref} className="site-header__phone">
              {siteConfig.phoneLabel}
            </a>
            <a href={siteConfig.telegramUrl} target="_blank" rel="noreferrer" className="site-header__telegram">
              Наш Телеграм
            </a>
          </div>
        </div>
      </div>

      <div className="site-header__top">
        <div className="shell site-header__main">
          <div className="brand brand--logo">
            <Link href="/" aria-label={`${siteConfig.name} — главная`}>
              <Image
                src="/images/branding/vs-o-rybkah-logo.jpg"
                alt={siteConfig.name}
                width={440}
                height={294}
                className="brand__logo"
                priority
              />
            </Link>
            <p className="brand__tagline">
              Вячеслав о рыбках - самый большой ассортимент аквариумной рыбы и растений на рынке
            </p>
          </div>

          <div className="site-header__tools">
            <div className="site-header__search-row">
              <form action="/catalog" method="get" className="header-search" role="search">
                <label className="sr-only" htmlFor="global-catalog-search">
                  Поиск товаров
                </label>
                <input
                  id="global-catalog-search"
                  type="search"
                  name="q"
                  placeholder={searchPlaceholder}
                />
                <button type="submit" className="header-search__button" aria-label="Найти товары">
                  <span aria-hidden="true">⌕</span>
                </button>
              </form>

              <FavoritesLink />
              <CartLink />
            </div>
          </div>
        </div>
      </div>

      <div className="site-header__nav-shell">
        <HeaderCategoriesNav priceListHref={siteConfig.priceListHref} sections={orderedSections} />
      </div>
    </header>
  );
}
