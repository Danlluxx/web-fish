"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "aquamarket:cart";

export interface CartItemState {
  slug: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItemState[];
  totalQuantity: number;
  uniqueItemsCount: number;
  hasHydrated: boolean;
  getQuantity: (slug: string) => number;
  isInCart: (slug: string) => boolean;
  addItem: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  replaceItems: (items: CartItemState[]) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function sanitizeCartItems(value: unknown, validSlugSet: Set<string>): CartItemState[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const slug = "slug" in item && typeof item.slug === "string" ? item.slug : "";
      const quantity = "quantity" in item && typeof item.quantity === "number" ? item.quantity : 0;

      if (!slug || quantity <= 0 || (validSlugSet.size > 0 && !validSlugSet.has(slug))) {
        return null;
      }

      return {
        slug,
        quantity: Math.max(1, Math.floor(quantity))
      };
    })
    .filter((item): item is CartItemState => Boolean(item));
}

export function CartProvider({
  children,
  validSlugs = []
}: {
  children: ReactNode;
  validSlugs?: string[];
}) {
  const [items, setItems] = useState<CartItemState[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const validSlugSet = useMemo(() => new Set(validSlugs), [validSlugs]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      const nextItems = raw ? sanitizeCartItems(JSON.parse(raw), validSlugSet) : [];
      setItems(nextItems);
    } catch {
      setItems([]);
    } finally {
      setHasHydrated(true);
    }
  }, [validSlugSet]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hasHydrated, items]);

  const value = useMemo<CartContextValue>(() => {
    const getQuantity = (slug: string) => items.find((item) => item.slug === slug)?.quantity ?? 0;

    return {
      items,
      totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
      uniqueItemsCount: items.length,
      hasHydrated,
      getQuantity,
      isInCart: (slug) => getQuantity(slug) > 0,
      addItem: (slug, quantity = 1) => {
        if (validSlugSet.size > 0 && !validSlugSet.has(slug)) {
          return;
        }

        const normalizedQuantity = Math.max(1, Math.floor(quantity));

        setItems((current) => {
          const existingItem = current.find((item) => item.slug === slug);

          if (!existingItem) {
            return [...current, { slug, quantity: normalizedQuantity }];
          }

          return current.map((item) =>
            item.slug === slug
              ? { ...item, quantity: item.quantity + normalizedQuantity }
              : item
          );
        });
      },
      setQuantity: (slug, quantity) => {
        if (validSlugSet.size > 0 && !validSlugSet.has(slug)) {
          return;
        }

        const normalizedQuantity = Math.floor(quantity);

        setItems((current) => {
          if (normalizedQuantity <= 0) {
            return current.filter((item) => item.slug !== slug);
          }

          const existingItem = current.find((item) => item.slug === slug);

          if (!existingItem) {
            return [...current, { slug, quantity: normalizedQuantity }];
          }

          return current.map((item) =>
            item.slug === slug ? { ...item, quantity: normalizedQuantity } : item
          );
        });
      },
      replaceItems: (nextItems) => {
        setItems(sanitizeCartItems(nextItems, validSlugSet));
      },
      removeItem: (slug) => {
        setItems((current) => current.filter((item) => item.slug !== slug));
      },
      clearCart: () => setItems([])
    };
  }, [hasHydrated, items, validSlugSet]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
