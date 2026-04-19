"use client";

import Link from "next/link";

import { FavoriteHeartIcon } from "@/components/favorites/favorite-heart-icon";
import { useFavorites } from "@/components/favorites/favorites-provider";

export function FavoritesLink() {
  const { favoritesCount } = useFavorites();

  return (
    <Link href="/favorites" className="favorites-link" aria-label="Открыть избранные товары">
      <FavoriteHeartIcon className="favorites-link__icon" />
      {favoritesCount > 0 ? <span className="favorites-link__count">{favoritesCount}</span> : null}
    </Link>
  );
}
