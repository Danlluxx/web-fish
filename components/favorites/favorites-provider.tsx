"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const FAVORITES_STORAGE_KEY = "aquamarket:favorites";

function sanitizeFavorites(value: unknown, validSlugSet: Set<string>): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueFavorites = value.filter((item): item is string => typeof item === "string" && item.length > 0);
  const deduplicatedFavorites = Array.from(new Set(uniqueFavorites));

  if (validSlugSet.size === 0) {
    return deduplicatedFavorites;
  }

  return deduplicatedFavorites.filter((slug) => validSlugSet.has(slug));
}

interface FavoritesContextValue {
  favorites: string[];
  favoritesCount: number;
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => void;
  setFavorite: (slug: string, value: boolean) => void;
  hasHydrated: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({
  children,
  validSlugs = []
}: {
  children: ReactNode;
  validSlugs?: string[];
}) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const validSlugSet = useMemo(() => new Set(validSlugs), [validSlugs]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      const nextFavorites = raw ? JSON.parse(raw) : [];
      setFavorites(sanitizeFavorites(nextFavorites, validSlugSet));
    } catch {
      setFavorites([]);
    } finally {
      setHasHydrated(true);
    }
  }, [validSlugSet]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, hasHydrated]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      favoritesCount: favorites.length,
      isFavorite: (slug) => favorites.includes(slug),
      toggleFavorite: (slug) => {
        if (validSlugSet.size > 0 && !validSlugSet.has(slug)) {
          return;
        }

        setFavorites((current) =>
          current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
        );
      },
      setFavorite: (slug, isActive) => {
        if (validSlugSet.size > 0 && !validSlugSet.has(slug)) {
          return;
        }

        setFavorites((current) => {
          if (isActive) {
            return current.includes(slug) ? current : [...current, slug];
          }

          return current.filter((item) => item !== slug);
        });
      },
      hasHydrated
    }),
    [favorites, hasHydrated, validSlugSet]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }

  return context;
}
