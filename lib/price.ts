export const rubleFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0
});

export function formatPrice(value: number | null | undefined): string {
  if (value == null) {
    return "Цена по запросу";
  }

  return rubleFormatter.format(value);
}
