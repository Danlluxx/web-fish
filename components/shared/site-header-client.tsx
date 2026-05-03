"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { CartLink } from "@/components/cart/cart-link";
import { FavoritesLink } from "@/components/favorites/favorites-link";
import {
  CatalogGridIcon,
  CloseIcon,
  CubeIcon,
  DeliveryTruckIcon,
  DocumentIcon,
  DownloadIcon,
  InfoIcon,
  MailIcon,
  MaxBrandIcon,
  MenuIcon,
  PhoneIcon,
  SearchIcon,
  ShieldIcon,
  TelegramBrandIcon
} from "@/components/shared/site-icons";
import { siteConfig } from "@/lib/site";

interface MenuLinkItem {
  label: string;
  href: string;
  icon: typeof CatalogGridIcon;
  note?: string;
  external?: boolean;
}

const MENU_GROUPS: MenuLinkItem[][] = [
  [
    { label: "Каталог", href: "/catalog", icon: CatalogGridIcon },
    { label: "Новое поступление", href: "/#new-arrivals", icon: CubeIcon }
  ],
  [
    { label: "Скачать актуальный прайс", href: siteConfig.priceListHref, icon: DownloadIcon, note: "Обновляется каждый день", external: true },
    { label: "Как оформить заказ", href: "/#how-to-order", icon: DocumentIcon },
    { label: "Доставка", href: "/#delivery", icon: DeliveryTruckIcon }
  ],
  [
    { label: "Позвонить", href: siteConfig.phoneHref, icon: PhoneIcon, note: siteConfig.phoneLabel },
    { label: "Написать в Telegram", href: siteConfig.telegramUrl, icon: TelegramBrandIcon, external: true },
    { label: "Написать в Max", href: siteConfig.maxUrl, icon: MaxBrandIcon, external: true }
  ],
  [
    { label: "О нас", href: "/#about", icon: InfoIcon },
    { label: "Гарантии", href: "/#guarantees", icon: ShieldIcon },
    { label: "Контакты", href: "/#contacts", icon: MailIcon }
  ]
];

function UtilityMessengerLink({
  href,
  label,
  children
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="utility-pill">
      <span className="utility-pill__icon">{children}</span>
      <span>{label}</span>
    </a>
  );
}

function HeaderSearchForm({ className, inputId }: { className: string; inputId: string }) {
  return (
    <form action="/catalog" method="get" className={className} role="search">
      <label className="sr-only" htmlFor={inputId}>
        Поиск товаров
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        placeholder="Поиск по рыбе, например: дискус"
      />
      <button type="submit" className="header-search__button" aria-label="Найти товары">
        <SearchIcon className="header-search__icon" />
      </button>
    </form>
  );
}

export function SiteHeaderClient() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.removeProperty("overflow");
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <header className="site-header site-header--refined">
      <div className="site-header__utility">
        <div className="shell site-header__utility-inner site-header__utility-inner--refined">
          <a href={siteConfig.phoneHref} className="site-header__phone site-header__phone--with-icon">
            <PhoneIcon className="site-header__utility-icon" />
            <span>{siteConfig.phoneLabel}</span>
          </a>

          <div className="site-header__utility-pills">
            <UtilityMessengerLink href={siteConfig.maxUrl} label="MAX">
              <MaxBrandIcon />
            </UtilityMessengerLink>
            <UtilityMessengerLink href={siteConfig.telegramUrl} label="Telegram">
              <TelegramBrandIcon />
            </UtilityMessengerLink>
          </div>
        </div>
      </div>

      <div className="site-header__top">
        <div className="shell site-header__refined-main">
          <div className="site-header__brand-row">
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={isMenuOpen}
              aria-controls="site-drawer-menu"
              aria-label="Открыть меню"
              onClick={() => setIsMenuOpen(true)}
            >
              <MenuIcon />
            </button>

            <Link href="/" className="site-header__brand-link" aria-label={`${siteConfig.name} — главная`}>
              <Image
                src="/images/branding/vs-o-rybkah-logo.webp"
                alt={siteConfig.name}
                width={440}
                height={294}
                className="site-header__compact-logo"
                priority
              />
              <span className="site-header__brand-copy">
                <strong>Вячеслав о рыбках</strong>
                <small>аквариумные рыбы и растения</small>
              </span>
            </Link>
          </div>

          <div className="site-header__quick-actions">
            <FavoritesLink showLabel className="site-header__quick-link" />
            <CartLink showLabel className="site-header__quick-link" />
          </div>
        </div>

        <div className="shell site-header__search-shell">
          <HeaderSearchForm className="header-search header-search--refined" inputId="global-catalog-search-mobile" />
        </div>
      </div>

      <div className={`site-drawer ${isMenuOpen ? "is-open" : ""}`} aria-hidden={!isMenuOpen}>
        <button
          type="button"
          className="site-drawer__backdrop"
          aria-label="Закрыть меню"
          onClick={() => setIsMenuOpen(false)}
        />

        <aside
          className="site-drawer__panel"
          id="site-drawer-menu"
          aria-label="Главное меню"
          role="dialog"
          aria-modal="true"
        >
          <div className="site-drawer__header">
            <button type="button" className="site-drawer__close" aria-label="Закрыть меню" onClick={() => setIsMenuOpen(false)}>
              <CloseIcon />
            </button>

            <div className="site-drawer__brand">
              <Image
                src="/images/branding/vs-o-rybkah-logo.webp"
                alt={siteConfig.name}
                width={440}
                height={294}
                className="site-drawer__brand-logo"
              />
              <div className="site-drawer__brand-copy">
                <strong>Вячеслав о рыбках</strong>
                <span>аквариумные рыбы и растения</span>
              </div>
            </div>
          </div>

          <div className="site-drawer__groups">
            {MENU_GROUPS.map((group, groupIndex) => (
              <div className="site-drawer__group" key={`menu-group-${groupIndex}`}>
                {group.map((item) => {
                  const Icon = item.icon;
                  const iconClassName =
                    Icon === TelegramBrandIcon || Icon === MaxBrandIcon
                      ? "site-drawer__item-icon site-drawer__item-icon--brand"
                      : "site-drawer__item-icon";

                  if (item.external) {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="site-drawer__item"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className={iconClassName}>
                          <Icon />
                        </span>
                        <span className="site-drawer__item-copy">
                          <strong>{item.label}</strong>
                          {item.note ? <small>{item.note}</small> : null}
                        </span>
                      </a>
                    );
                  }

                  return (
                    <Link key={item.label} href={item.href} className="site-drawer__item" onClick={() => setIsMenuOpen(false)}>
                      <span className={iconClassName}>
                        <Icon />
                      </span>
                      <span className="site-drawer__item-copy">
                        <strong>{item.label}</strong>
                        {item.note ? <small>{item.note}</small> : null}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </header>
  );
}
