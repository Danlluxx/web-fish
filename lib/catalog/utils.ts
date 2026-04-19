export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("ё", "е")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function uniqueBySlug<T extends { slug: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.slug, item])).values());
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}
