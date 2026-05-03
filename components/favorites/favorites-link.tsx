"use client";

import Link from "next/link";

import { FavoriteHeartIcon } from "@/components/favorites/favorite-heart-icon";
import { useFavorites } from "@/components/favorites/favorites-provider";

interface FavoritesLinkProps {
  showLabel?: boolean;
  className?: string;
}

export function FavoritesLink({ showLabel = false, className }: FavoritesLinkProps) {
  const { favoritesCount } = useFavorites();
  const linkClassName = ["favorites-link", showLabel ? "favorites-link--with-label" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <Link href="/favorites" className={linkClassName} aria-label="Открыть избранные товары">
      <FavoriteHeartIcon className="favorites-link__icon" />
      {showLabel ? <span className="favorites-link__label">Избранное</span> : null}
      {favoritesCount > 0 ? <span className="favorites-link__count">{favoritesCount}</span> : null}
    </Link>
  );
}
