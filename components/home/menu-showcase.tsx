import Link from "next/link";

import { buildCatalogPath, buildProductPath } from "@/lib/catalog/urls";
import { getProductMedia } from "@/lib/catalog/media-server";
import { siteConfig } from "@/lib/site";
import type { Product } from "@/types/catalog";

interface MenuShowcaseProps {
  showcaseProduct: Product;
}

interface MenuItem {
  label: string;
  href?: string;
  note?: string;
  external?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: "Прайс-лист",
    href: siteConfig.priceListHref,
    external: true
  },
  {
    label: "Птицы",
    note: "скоро"
  },
  {
    label: "Живые растения",
    href: buildCatalogPath("rasteniya")
  },
  {
    label: "Амфибии",
    href: buildCatalogPath("amfibii")
  },
  {
    label: "Рептилии",
    note: "скоро"
  },
  {
    label: "Беспозвоночные",
    href: buildCatalogPath("bespozvonochnye")
  },
  {
    label: "Рыбы",
    href: buildCatalogPath("ryby")
  },
  {
    label: "Аптечка",
    note: "скоро"
  },
  {
    label: "Наш Telegram",
    note: "ссылка добавляется"
  }
];

export async function MenuShowcase({ showcaseProduct }: MenuShowcaseProps) {
  const media = await getProductMedia(showcaseProduct);
  const primaryMedia = media[0];
  const secondaryMedia = media[1];

  return (
    <section className="menu-showcase">
      <div className="menu-panel">
        <div className="menu-panel__header">
          <span>Меню</span>
          <small>Структура разделов</small>
        </div>

        <div className="menu-panel__items">
          {MENU_ITEMS.map((item) => {
            const content = (
              <>
                <span>{item.label}</span>
                {item.note ? <small>{item.note}</small> : <span className="menu-panel__icon">+</span>}
              </>
            );

            if (item.href && item.external) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="menu-panel__item menu-panel__item--accent"
                >
                  {content}
                </a>
              );
            }

            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className="menu-panel__item">
                  {content}
                </Link>
              );
            }

            return (
              <div key={item.label} className="menu-panel__item menu-panel__item--muted" aria-disabled="true">
                {content}
              </div>
            );
          })}
        </div>
      </div>

      <article className="fish-showcase">
        <div className="fish-showcase__copy">
          <span className="eyebrow">Пример карточки</span>
          <h2>Живые фотографии можно показывать прямо в карточке товара</h2>
          <p>
            Для товара <strong>{showcaseProduct.title}</strong> уже подключены реальные фотографии,
            поэтому каталог можно развивать от Excel-прайса к полноценным карточкам с живым контентом.
          </p>

          <div className="fish-showcase__meta">
            <span>{showcaseProduct.category}</span>
            <span>{showcaseProduct.subcategory}</span>
            <span>{media.length} фото</span>
          </div>

          <div className="fish-showcase__actions">
            <Link href={buildProductPath(showcaseProduct.slug)} className="button button--primary">
              Открыть карточку товара
            </Link>
            <Link href={buildCatalogPath(showcaseProduct.categorySlug)} className="button button--secondary">
              Перейти в раздел Рыбы
            </Link>
          </div>
        </div>

        <div className="fish-showcase__gallery">
          <img src={primaryMedia.src} alt={primaryMedia.alt} className="fish-showcase__image fish-showcase__image--main" />
          {secondaryMedia ? (
            <img
              src={secondaryMedia.src}
              alt={secondaryMedia.alt}
              className="fish-showcase__image fish-showcase__image--secondary"
            />
          ) : null}
        </div>
      </article>
    </section>
  );
}
