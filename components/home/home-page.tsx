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

const TRUST_POINTS = [
  {
    icon: DeliveryTruckIcon,
    title: "Отправка по России",
    description: "Собрали удобный путь от выбора товара до доставки."
  },
  {
    icon: DocumentIcon,
    title: "Актуальный прайс",
    description: "Каталог и Excel-прайс синхронизируются после обновления."
  },
  {
    icon: SendIcon,
    title: "Поддержка в мессенджерах",
    description: "Можно быстро уточнить наличие, фото и детали заказа."
  },
  {
    icon: ShieldIcon,
    title: "Понятная структура",
    description: "Сначала основные категории, потом удобный вход в нужный раздел."
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
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8
  };

  switch (slug) {
    case "ryby":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path {...commonProps} d="M7 24c5-8 13-12 23-12 4 0 8 1 11 3-2 1-3 3-3 5s1 4 3 5c-3 2-7 3-11 3-10 0-18-4-23-12Z" />
          <path {...commonProps} d="M30 18c-2 2-3 4-3 6s1 4 3 6" />
          <path {...commonProps} d="M14 24h10" />
          <circle cx="35" cy="21" r="1.8" fill="currentColor" />
        </svg>
      );
    case "bespozvonochnye":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path {...commonProps} d="M14 26c0-6 4-10 10-10s10 4 10 10c0 4-2 7-5 8" />
          <path {...commonProps} d="M19 20c-3-1-6 0-8 3" />
          <path {...commonProps} d="M29 20c3-1 6 0 8 3" />
          <path {...commonProps} d="M19 31c-3 1-5 3-6 6" />
          <path {...commonProps} d="M29 31c3 1 5 3 6 6" />
          <path {...commonProps} d="M24 16v20" />
          <path {...commonProps} d="M18 26h12" />
        </svg>
      );
    case "rasteniya":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path {...commonProps} d="M24 39V13" />
          <path {...commonProps} d="M24 20c-7 0-11-4-11-11 7 0 11 4 11 11Z" />
          <path {...commonProps} d="M24 26c7 0 11-4 11-11-7 0-11 4-11 11Z" />
          <path {...commonProps} d="M24 32c-6 0-9 3-9 8 6 0 9-3 9-8Z" />
          <path {...commonProps} d="M24 34c6 0 9 2 9 7-6 0-9-2-9-7Z" />
        </svg>
      );
    case "amfibii":
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path {...commonProps} d="M12 29c0-7 5-12 12-12s12 5 12 12c0 4-2 7-5 9" />
          <path {...commonProps} d="M19 17c0-3 2-5 5-5s5 2 5 5" />
          <path {...commonProps} d="M17 28l-5 6" />
          <path {...commonProps} d="M31 28l5 6" />
          <path {...commonProps} d="M20 33l-2 7" />
          <path {...commonProps} d="M28 33l2 7" />
          <circle cx="21" cy="22" r="1.6" fill="currentColor" />
          <circle cx="27" cy="22" r="1.6" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="12" {...commonProps} />
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

      <section className="trust-strip" id="delivery">
        <div className="trust-strip__grid">
          {TRUST_POINTS.map((point) => {
            const Icon = point.icon;

            return (
              <article key={point.title} className="trust-card">
                <span className="trust-card__icon">
                  <Icon />
                </span>
                <strong>{point.title}</strong>
                <span>{point.description}</span>
              </article>
            );
          })}
        </div>
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
