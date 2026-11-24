import "server-only";
import { PRODUCTS } from "@/data/products";
import type { Product } from "@/lib/types";

/**
 * Server-side product source. Swap the body for a real fetch/DB query;
 * callers already treat it as async and failures surface via app/error.tsx.
 */
export async function getProducts(): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 600)); // simulated latency
  return [...PRODUCTS];
}

export function getProductById(id: number): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
