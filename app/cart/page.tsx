import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart/cart-page-client";
import { getAllProducts } from "@/lib/catalog/service";

export const metadata: Metadata = {
  title: "Корзина",
  description: "Корзина с оформлением заказа"
};

export default async function CartPage() {
  const products = await getAllProducts();

  return <CartPageClient products={products} />;
}
