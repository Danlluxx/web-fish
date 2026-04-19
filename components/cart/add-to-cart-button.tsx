"use client";

import { useCart } from "@/components/cart/cart-provider";

interface AddToCartButtonProps {
  productSlug: string;
  productTitle: string;
  variant?: "card" | "detail";
}

export function AddToCartButton({
  productSlug,
  productTitle,
  variant = "card"
}: AddToCartButtonProps) {
  const { addItem, getQuantity, hasHydrated, setQuantity } = useCart();
  const quantity = hasHydrated ? getQuantity(productSlug) : 0;
  const label = "В корзину";

  const cartIcon = (
    <svg
      className="cart-button__icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 5H5L7.2 15.2C7.3 15.7 7.8 16 8.3 16H17.8C18.3 16 18.8 15.7 18.9 15.2L21 8H6.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="19" r="1.5" fill="currentColor" />
      <circle cx="18" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );

  if (quantity > 0) {
    return (
      <div
        className={`cart-quantity cart-quantity--${variant}`}
        role="group"
        aria-label={`Количество товара ${productTitle} в корзине`}
      >
        <button
          type="button"
          className="cart-quantity__button"
          onClick={() => setQuantity(productSlug, quantity - 1)}
          aria-label={`Уменьшить количество ${productTitle}`}
          title={`Уменьшить количество ${productTitle}`}
        >
          <span aria-hidden="true">-</span>
        </button>

        <div className="cart-quantity__value">
          {cartIcon}
          <span className="cart-quantity__count">{quantity}</span>
          {variant === "detail" ? <span className="cart-quantity__label">в корзине</span> : null}
        </div>

        <button
          type="button"
          className="cart-quantity__button"
          onClick={() => addItem(productSlug)}
          aria-label={`Увеличить количество ${productTitle}`}
          title={`Увеличить количество ${productTitle}`}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`cart-button cart-button--${variant}`}
      onClick={() => addItem(productSlug)}
      aria-label={`Добавить ${productTitle} в корзину`}
      title={`Добавить ${productTitle} в корзину`}
    >
      {cartIcon}
      <span className="cart-button__label">{label}</span>
    </button>
  );
}
