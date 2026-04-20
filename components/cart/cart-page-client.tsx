"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { getPrimaryProductMedia } from "@/lib/catalog/media";
import { formatPrice, rubleFormatter } from "@/lib/price";
import { buildCatalogPath, buildProductPath } from "@/lib/catalog/urls";
import type { Product } from "@/types/catalog";

interface CartPageClientProps {
  products: Product[];
}

function formatPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  } else if (digits.startsWith("9")) {
    digits = `7${digits}`;
  }

  digits = digits.slice(0, 11);

  const countryCode = digits[0];
  const part1 = digits.slice(1, 4);
  const part2 = digits.slice(4, 7);
  const part3 = digits.slice(7, 9);
  const part4 = digits.slice(9, 11);

  let formatted = `+${countryCode}`;

  if (part1) {
    formatted += ` ${part1}`;
  }

  if (part2) {
    formatted += ` ${part2}`;
  }

  if (part3) {
    formatted += ` ${part3}`;
  }

  if (part4) {
    formatted += ` ${part4}`;
  }

  return formatted;
}

export function CartPageClient({ products }: CartPageClientProps) {
  const { items, totalQuantity, uniqueItemsCount, hasHydrated, setQuantity, removeItem, clearCart } = useCart();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submittedOrderId, setSubmittedOrderId] = useState("");
  const [submittedNotice, setSubmittedNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartProducts = useMemo(() => {
    const itemMap = new Map(items.map((item) => [item.slug, item.quantity]));

    return products
      .filter((product) => itemMap.has(product.slug))
      .map((product) => ({
        product,
        quantity: itemMap.get(product.slug) ?? 1
      }));
  }, [items, products]);

  const totalAmount = useMemo(
    () =>
      cartProducts.reduce((sum, { product, quantity }) => sum + (product.price ?? 0) * quantity, 0),
    [cartProducts]
  );

  const missingPriceCount = useMemo(
    () => cartProducts.filter(({ product }) => product.price == null).length,
    [cartProducts]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSubmittedNotice("");

    if (cartProducts.length === 0) {
      setSubmitError("Добавьте товары в корзину перед оформлением.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer: {
            fullName,
            phone,
            deliveryAddress
          },
          items: cartProducts.map(({ product, quantity }) => ({
            slug: product.slug,
            quantity
          }))
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        orderId?: string;
        emailStatus?: "sent" | "skipped" | "failed";
        emailMessage?: string;
      };

      if (!response.ok || !payload.orderId) {
        setSubmitError(payload.error ?? "Не удалось оформить заказ. Попробуйте ещё раз.");
        return;
      }

      clearCart();
      setSubmittedOrderId(payload.orderId);
      setSubmittedNotice(
        payload.emailMessage ??
          (payload.emailStatus === "sent"
            ? "Excel-файл заказа отправлен на почту."
            : "Заказ оформлен.")
      );
      setFullName("");
      setPhone("");
      setDeliveryAddress("");
    } catch {
      setSubmitError("Не удалось отправить заказ. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasHydrated) {
    return (
      <div className="catalog-layout">
        <section className="empty-state empty-state--standalone">
          <h2>Загружаем корзину</h2>
          <p>Подготавливаем выбранные товары и форму оформления заказа.</p>
        </section>
      </div>
    );
  }

  if (submittedOrderId) {
    return (
      <div className="catalog-layout">
        <section className="catalog-hero">
          <div className="catalog-hero__header">
            <div>
              <span className="eyebrow">Заказ оформлен</span>
              <h1>Заявка принята</h1>
              <p>
                Заказ <strong>{submittedOrderId}</strong> сохранён. Состав корзины очищен, можно
                вернуться к каталогу и продолжить подбор товаров.
              </p>
              {submittedNotice ? <p className="submission-note">{submittedNotice}</p> : null}
            </div>
          </div>
          <div className="hero-panel__actions">
            <Link href={buildCatalogPath("ryby")} className="button button--primary">
              Вернуться в каталог
            </Link>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setSubmittedOrderId("");
                setSubmittedNotice("");
              }}
            >
              Оформить ещё заказ
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="catalog-layout">
      <section className="catalog-hero">
        <div className="catalog-hero__header">
          <div>
            <span className="eyebrow">Корзина</span>
            <h1>Формирование заказа</h1>
            <p>
              Добавляйте товары в корзину, указывайте количество и отправляйте заявку с данными
              получателя.
            </p>
          </div>

          <div className="catalog-hero__stats">
            <div className="catalog-hero__stat">
              <strong>{uniqueItemsCount}</strong>
              <span>позиций в корзине</span>
            </div>
            <div className="catalog-hero__stat">
              <strong>{totalQuantity}</strong>
              <span>единиц к заказу</span>
            </div>
            <div className="catalog-hero__stat catalog-hero__stat--accent">
              <strong>{rubleFormatter.format(totalAmount)}</strong>
              <span>сумма заказа</span>
              {missingPriceCount > 0 ? <small>Для {missingPriceCount} позиций цена пока не указана</small> : null}
            </div>
          </div>
        </div>
      </section>

      {cartProducts.length > 0 ? (
        <div className="cart-layout">
          <section className="cart-items">
            <div className="catalog-grid-section__header">
              <h2>Товары в корзине</h2>
              <p>Количество можно менять прямо здесь перед отправкой заявки.</p>
            </div>

            <div className="cart-list">
              {cartProducts.map(({ product, quantity }) => {
                const image = getPrimaryProductMedia(product);

                return (
                  <article className="cart-item" key={product.id}>
                    <Link href={buildProductPath(product.slug)} className="cart-item__image-link">
                      <img src={image.src} alt={image.alt} className="cart-item__image" loading="lazy" />
                    </Link>

                    <div className="cart-item__content">
                      <div className="cart-item__meta">
                        <span className="product-card__meta-chip">{product.category}</span>
                        <span className="cart-item__subcategory">{product.subcategory}</span>
                      </div>

                      <Link href={buildProductPath(product.slug)} className="cart-item__title">
                        {product.title}
                      </Link>

                      <div className="cart-item__pricing">
                        <span>{product.price != null ? `${formatPrice(product.price)} / шт` : formatPrice(product.price)}</span>
                        <strong>{product.price != null ? formatPrice(product.price * quantity) : "—"}</strong>
                      </div>

                      <div className="cart-item__controls">
                        <div className="cart-qty">
                          <button
                            type="button"
                            className="cart-qty__button"
                            onClick={() => setQuantity(product.slug, quantity - 1)}
                            aria-label={`Уменьшить количество ${product.title}`}
                          >
                            -
                          </button>
                          <input
                            className="cart-qty__input"
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(event) =>
                              setQuantity(product.slug, Number(event.target.value || 1))
                            }
                            aria-label={`Количество ${product.title}`}
                          />
                          <button
                            type="button"
                            className="cart-qty__button"
                            onClick={() => setQuantity(product.slug, quantity + 1)}
                            aria-label={`Увеличить количество ${product.title}`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-item__remove"
                          onClick={() => removeItem(product.slug)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="cart-summary-panel">
              <div className="cart-summary-panel__copy">
                <span className="eyebrow">Итог по корзине</span>
                <h3>Сумма заказа</h3>
                <p>
                  {missingPriceCount > 0
                    ? `Учтены все товары с доступной ценой. Для ${missingPriceCount} позиций стоимость пока не указана.`
                    : "Общая сумма заказа указана без учета стоимости доставки."}
                </p>
              </div>
              <div className="cart-summary-panel__amount">{rubleFormatter.format(totalAmount)}</div>
            </div>
          </section>

          <aside className="cart-checkout">
            <div className="catalog-grid-section__header">
              <h2>Оформить заказ</h2>
              <p>Укажите ваши данные и адрес доставки, чтобы отправить заказ.</p>
            </div>

            <form className="checkout-form" onSubmit={handleSubmit}>
              <label className="checkout-form__field">
                <span>ФИО</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Иванов Иван Иванович"
                  required
                />
              </label>

              <label className="checkout-form__field">
                <span>Номер телефона</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
                  placeholder="+7 999 777 66 55"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={16}
                  required
                />
              </label>

              <label className="checkout-form__field">
                <span>Адрес доставки</span>
                <textarea
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  placeholder="Город, улица, дом, квартира, комментарий для доставки"
                  rows={5}
                  required
                />
              </label>

              {submitError ? <p className="checkout-form__error">{submitError}</p> : null}

              <button type="submit" className="button button--primary" disabled={isSubmitting}>
                {isSubmitting ? "Отправляем..." : "Оформить заказ"}
              </button>
            </form>
          </aside>
        </div>
      ) : (
        <section className="empty-state empty-state--standalone">
          <h2>Корзина пока пустая</h2>
          <p>Добавьте товары из каталога, чтобы указать количество и оформить заказ.</p>
          <Link href={buildCatalogPath("ryby")} className="button button--primary">
            Перейти к товарам
          </Link>
        </section>
      )}
    </div>
  );
}
