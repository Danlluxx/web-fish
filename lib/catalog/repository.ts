import { PRODUCTS } from "@/data/products";
import type { Product } from "@/types/catalog";

export interface ProductRepository {
  getAll(): Promise<Product[]>;
  getBySlug(slug: string): Promise<Product | null>;
}

class InMemoryProductRepository implements ProductRepository {
  async getAll(): Promise<Product[]> {
    return PRODUCTS;
  }

  async getBySlug(slug: string): Promise<Product | null> {
    return PRODUCTS.find((product) => product.slug === slug) ?? null;
  }
}

export const productRepository: ProductRepository = new InMemoryProductRepository();
