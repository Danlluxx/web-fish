"use client";

import Link from "next/link";

import { useCart } from "@/components/cart/cart-provider";

interface CartLinkProps {
  showLabel?: boolean;
  className?: string;
}

export function CartLink({ showLabel = false, className }: CartLinkProps) {
  const { totalQuantity } = useCart();
  const linkClassName = ["favorites-link", "cart-link", showLabel ? "favorites-link--with-label" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <Link href="/cart" className={linkClassName} aria-label="Открыть корзину">
      <svg
        className="cart-link__icon"
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
      {showLabel ? <span className="favorites-link__label">Корзина</span> : null}
      {totalQuantity > 0 ? <span className="favorites-link__count">{totalQuantity}</span> : null}
    </Link>
  );
}
