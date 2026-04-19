"use client";

import { FavoriteHeartIcon } from "@/components/favorites/favorite-heart-icon";
import { useFavorites } from "@/components/favorites/favorites-provider";

interface FavoriteToggleButtonProps {
  productSlug: string;
  productTitle: string;
  variant?: "card" | "detail";
}

export function FavoriteToggleButton({
  productSlug,
  productTitle,
  variant = "card"
}: FavoriteToggleButtonProps) {
  const { isFavorite, toggleFavorite, hasHydrated } = useFavorites();
  const active = hasHydrated && isFavorite(productSlug);

  return (
    <button
      type="button"
      className={`favorite-button favorite-button--${variant} ${active ? "is-active" : ""}`}
      onClick={() => toggleFavorite(productSlug)}
      aria-pressed={active}
      aria-label={active ? `Убрать ${productTitle} из избранного` : `Добавить ${productTitle} в избранное`}
      title={active ? "Убрать из избранного" : "Добавить в избранное"}
    >
      <FavoriteHeartIcon className="favorite-button__icon" />
      {variant === "detail" ? <span>{active ? "В избранном" : "В избранное"}</span> : null}
    </button>
  );
}
