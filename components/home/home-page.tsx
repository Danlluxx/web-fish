import Link from "next/link";

import { ProductCard } from "@/components/catalog/product-card";
import { HomeHeroGallery } from "@/components/home/home-hero-gallery";
import {
  CardIcon,
  CartStepIcon,
  DeliveryTruckIcon,
  DocumentIcon,
  DownloadIcon,
  InfoIcon,
  MailIcon,
  PhoneIcon,
  SendIcon,
  ShieldIcon
} from "@/components/shared/site-icons";
import { buildCatalogPath } from "@/lib/catalog/urls";
import { siteConfig } from "@/lib/site";
import type { CatalogSection, Product } from "@/types/catalog";

interface HomePageProps {
  sections: CatalogSection[];
  featuredProducts: Product[];
  hasNewArrivals: boolean;
  totalNewArrivals: number;
  fallbackProductsHref: string;
  totalProducts: number;
  totalSubcategories: number;
}

const HOME_SECTION_ORDER = ["ryby", "bespozvonochnye", "rasteniya", "amfibii"] as const;

const ORDER_STEPS = [
  {
    step: "1",
    icon: CartStepIcon,
    title: "Добавьте позиции",
    description: "в корзину"
  },
  {
    step: "2",
    icon: SendIcon,
    title: "Отправьте заказ",
    description: "через сайт"
  },
  {
    step: "3",
    icon: PhoneIcon,
    title: "Мы свяжемся с вами",
    description: "по телефону"
  },
  {
    step: "4",
    icon: CardIcon,
    title: "Подтверждение",
    description: "и оплата заказа"
  },
  {
    step: "5",
    icon: DeliveryTruckIcon,
    title: "Отправка",
    description: "по РФ"
  }
];

const INFO_CARDS = [
  {
    id: "about",
    icon: InfoIcon,
    title: "О нас",
    description: "Мы собираем понятный каталог аквариумных рыб, растений, амфибий и беспозвоночных с быстрым входом в нужный раздел."
  },
  {
    id: "guarantees",
    icon: ShieldIcon,
    title: "Гарантии",
    description: "Прайс и каталог синхронизируются после обновления, а перед отправкой мы отдельно подтверждаем состав заказа."
  },
  {
    id: "contacts",
    icon: MailIcon,
    title: "Контакты",
    description: "Связаться можно по телефону, в Telegram или Max. Это самые быстрые каналы для уточнения деталей."
  }
];

function CategoryGlyph({ slug }: { slug: string }) {
  switch (slug) {
    case "ryby":
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <g fill="currentColor">
            <path d="M18 51c7-15 20-24 38-24 10 0 20 4 26 10l10-8v13c4 3 6 6 6 9s-2 6-6 9v13l-10-8c-6 6-16 10-26 10-18 0-31-9-38-24Zm17-5c0 2 2 4 4 4s4-2 4-4-2-4-4-4-4 2-4 4Z" />
            <path d="M50 48c7 0 13 2 18 5-5 4-11 6-18 6-8 0-15-2-22-6 7-3 14-5 22-5Z" opacity="0.18" />
          </g>
        </svg>
      );
    case "bespozvonochnye":
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <g fill="currentColor">
            <ellipse cx="50" cy="55" rx="18" ry="16" />
            <circle cx="50" cy="32" r="9" />
            <circle cx="36" cy="41" r="5" />
            <circle cx="64" cy="41" r="5" />
            <path d="M30 54H16v-4h14zM84 54H70v-4h14zM31 63 16 72l-2-4 15-9zM69 63l15 9-2 4-15-9zM37 31l-9-10 3-3 9 10zM63 31l9-10 3 3-9 10z" />
          </g>
        </svg>
      );
    case "rasteniya":
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <g fill="currentColor">
            <path d="M47 82V47h6v35z" />
            <path d="M49 49c-11 0-19-6-22-18 11 0 19 4 22 13 3-9 11-13 22-13-3 12-11 18-22 18Z" />
            <path d="M49 62c-9 0-15-5-17-15 9 0 15 3 17 10 2-7 8-10 17-10-2 10-8 15-17 15Z" opacity="0.82" />
            <path d="M49 76c-8 0-13-4-15-12 8 0 13 2 15 8 2-6 7-8 15-8-2 8-7 12-15 12Z" opacity="0.64" />
          </g>
        </svg>
      );
    case "amfibii":
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <g fill="currentColor">
            <path d="M24 61c0-11 10-20 23-20h8c13 0 23 9 23 20 0 9-7 16-17 18l8 9-5 4-11-12H46L35 92l-5-4 8-9c-10-2-14-9-14-18Z" />
            <circle cx="40" cy="39" r="7" />
            <circle cx="60" cy="39" r="7" />
            <circle cx="40" cy="39" r="2.4" fill="white" />
            <circle cx="60" cy="39" r="2.4" fill="white" />
            <path d="M40 63c4 3 16 3 20 0 0 6-4 10-10 10s-10-4-10-10Z" fill="white" opacity="0.9" />
          </g>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle
            cx="24"
            cy="24"
            r="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export function HomePage({
  sections,
  featuredProducts,
  hasNewArrivals,
  totalNewArrivals,
  fallbackProductsHref,
  totalProducts,
  totalSubcategories
}: HomePageProps) {
  const orderedSections = HOME_SECTION_ORDER.map((slug) =>
    sections.find((section) => section.slug === slug)
  ).filter((section): section is CatalogSection => Boolean(section));
  const heroBenefits = [
    {
      title: `Более ${totalProducts} позиций`,
      description: "рыб, растений и других аквариумных обитателей."
    },
    {
      title: "Низкие цены",
      description: "работаем напрямую с поставщиками и регулярно обновляем прайс."
    },
    {
      title: "Живые фото товаров",
      description: "карточки помогают сверяться с наличием и внешним видом."
    },
    {
      title: `${totalSubcategories} подкатегорий`,
      description: "каталог уже разбит по видам, чтобы путь к нужному товару был короче."
    }
  ];

  return (
    <div className="home-layout home-layout--refined">
      <section className="home-hero" id="home">
        <div className="home-hero__visual">
          <HomeHeroGallery
            className="home-hero__gallery"
            overlay={
              <div className="home-hero__overlay-copy">
                <div className="home-hero__overlay-main">
                  <h1>Редкие аквариумные рыбки с отправкой по всей России</h1>
                  <p className="home-hero__accent">до трех дней</p>
                </div>

                <ul className="home-hero__feature-list">
                  {heroBenefits.map((benefit) => (
                    <li key={benefit.title} className="home-hero__feature-item">
                      <span className="home-hero__feature-icon">
                        <ShieldIcon />
                      </span>
                      <span className="home-hero__feature-copy">
                        <strong>{benefit.title}</strong>
                        <small>{benefit.description}</small>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="home-hero__cta-row">
                  <a
                    href={siteConfig.priceListHref}
                    className="home-hero__price-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="home-hero__price-icon">
                      <DownloadIcon />
                    </span>
                    <span className="home-hero__price-copy">
                      <strong>Скачать актуальный прайс</strong>
                      <small>Обновляется каждый день</small>
                    </span>
                  </a>

                  <Link href="/catalog" className="home-hero__catalog-link">
                    Открыть каталог
                  </Link>
                </div>
              </div>
            }
          />
        </div>
      </section>

      <section className="order-flow" id="how-to-order">
        <div className="section-header section-header--stack-mobile">
          <div>
            <h2>Как оформить заказ</h2>
          </div>
        </div>

        <div className="order-flow__grid">
          {ORDER_STEPS.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.step} className="order-step-card">
                <span className="order-step-card__index">{item.step}</span>
                <span className="order-step-card__icon">
                  <Icon />
                </span>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="catalog-hub" id="catalog">
        <div className="section-header">
          <div>
            <span className="eyebrow">Каталог товаров</span>
            <h2>Каталог товаров</h2>
          </div>
          <Link href="/catalog" className="section-link">
            Смотреть все
          </Link>
        </div>

        <div className="catalog-hub__grid">
          {orderedSections.map((section) => (
            <Link href={buildCatalogPath(section.slug)} className="catalog-hub-card" key={section.slug}>
              <span className="catalog-hub-card__icon" style={{ color: section.accent }}>
                <CategoryGlyph slug={section.slug} />
              </span>
              <strong>{section.title}</strong>
              <span className="catalog-hub-card__meta">{section.subcategories.length} подкатегорий</span>
              <p>{section.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-products" id="new-arrivals">
        <div className="section-header">
          <div>
            <span className="eyebrow">Обновление прайса</span>
            <h2>Новые поступления</h2>
          </div>
          <Link href="/catalog" className="section-link">
            Смотреть все
          </Link>
        </div>

        {hasNewArrivals ? (
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Новых позиций пока нет</h3>
            <p>
              После следующей загрузки прайса здесь автоматически появятся товары, которых не было
              в предыдущей версии каталога.
            </p>
            <Link href={fallbackProductsHref} className="button button--secondary">
              Все товары
            </Link>
          </div>
        )}

        {hasNewArrivals && totalNewArrivals > featuredProducts.length ? (
          <p className="featured-products__note">
            Показаны {featuredProducts.length} из {totalNewArrivals} новых позиций.
          </p>
        ) : null}
      </section>

      <section className="home-info">
        <div className="home-info__grid">
          {INFO_CARDS.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.id} id={item.id} className="home-info-card">
                <span className="home-info-card__icon">
                  <Icon />
                </span>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                {item.id === "contacts" ? (
                  <div className="home-info-card__links">
                    <a href={siteConfig.phoneHref}>{siteConfig.phoneLabel}</a>
                    <a href={siteConfig.telegramUrl} target="_blank" rel="noreferrer">
                      Telegram
                    </a>
                    <a href={siteConfig.maxUrl} target="_blank" rel="noreferrer">
                      Max
                    </a>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
