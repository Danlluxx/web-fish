const LAST_ORDER_STORAGE_KEY = "aquamarket:last-order";

export interface LastOrderSnapshotItem {
  slug: string;
  quantity: number;
}

export interface LastOrderSnapshot {
  orderId: string;
  savedAt: string;
  items: LastOrderSnapshotItem[];
}

function sanitizeLastOrderItems(value: unknown): LastOrderSnapshotItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const slug = "slug" in item && typeof item.slug === "string" ? item.slug.trim() : "";
      const quantity = "quantity" in item && typeof item.quantity === "number" ? item.quantity : 0;

      if (!slug || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      return {
        slug,
        quantity: Math.max(1, Math.floor(quantity))
      };
    })
    .filter((item): item is LastOrderSnapshotItem => Boolean(item));
}

export function readLastOrderSnapshot(): LastOrderSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LAST_ORDER_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<LastOrderSnapshot>;
    const orderId = typeof parsed.orderId === "string" ? parsed.orderId.trim() : "";
    const savedAt = typeof parsed.savedAt === "string" ? parsed.savedAt : "";
    const items = sanitizeLastOrderItems(parsed.items);

    if (!orderId || !savedAt || items.length === 0) {
      return null;
    }

    return {
      orderId,
      savedAt,
      items
    };
  } catch {
    return null;
  }
}

export function writeLastOrderSnapshot(snapshot: LastOrderSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(snapshot));
}
