import { getRuntimeCatalogProducts } from "@/lib/catalog/data-source";
import type { Product } from "@/types/catalog";

export interface ProductRepository {
  getAll(): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
}

class InMemoryProductRepository implements ProductRepository {
  async getAll(): Promise<Product[]> {
    return getRuntimeCatalogProducts();
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const products = await getRuntimeCatalogProducts();
    return products.find((product) => product.slug === slug) ?? null;
  }
}

export const productRepository: ProductRepository = new InMemoryProductRepository();
