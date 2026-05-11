import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ProductCard } from "@/components/catalog/product-card";
import { getNewArrivalProducts } from "@/lib/catalog/service";
import { formatCount } from "@/lib/catalog/utils";

export const metadata: Metadata = {
  title: "Новые поступления",
  description: "Все товары из последней загруженной таблицы новых поступлений."
};

export default async function NewArrivalsPage() {
  const newArrivals = await getNewArrivalProducts();

  return (
    <div className="catalog-layout">
      <section className="catalog-hero">
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Новые поступления" }
          ]}
        />

        <div className="catalog-hero__header">
          <div>
            <span className="eyebrow">Обновление прайса</span>
            <h1>Новые поступления</h1>
            <p>Все позиции из последнего файла, загруженного через админ-панель новых поступлений.</p>
          </div>

          <div className="catalog-hero__stats">
            <div>
              <strong>{formatCount(newArrivals.total)}</strong>
              <span>новых позиций</span>
            </div>
          </div>
        </div>
      </section>

      <section className="catalog-grid-section">
        <div className="catalog-grid-section__header">
          <h2>Все новые поступления</h2>
          <Link href="/catalog" className="button button--secondary">
            В каталог
          </Link>
        </div>

        {newArrivals.items.length > 0 ? (
          <div className="product-grid">
            {newArrivals.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Новых поступлений пока нет</h3>
            <p>Загрузите Excel-файл через админ-панель, и здесь появится полный список выбранных товаров.</p>
            <Link href="/catalog" className="button button--secondary">
              Перейти в каталог
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
