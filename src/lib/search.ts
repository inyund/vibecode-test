import { useDeferredValue, useMemo, useState } from "react";
import type { Product } from "./types";

/** Case-insensitive substring match on the product name only. A blank query matches everything. */
export function filterProductsByName<T extends Pick<Product, "name">>(products: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...products];
  return products.filter((p) => p.name.toLowerCase().includes(q));
}

/**
 * Search-box state plus the filtered products. The input stays bound to `query` (updates on every
 * keystroke) while filtering runs against a deferred copy, so typing stays responsive.
 */
export function useProductSearch<T extends Pick<Product, "name">>(products: readonly T[]) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const visible = useMemo(() => filterProductsByName(products, deferredQuery), [products, deferredQuery]);
  return { query, setQuery, visible };
}
