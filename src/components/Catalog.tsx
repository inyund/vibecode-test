"use client";

import type { Product } from "@/lib/types";
import { useProductSearch } from "@/lib/search";
import { ProductCard } from "./ProductCard";
import styles from "./Catalog.module.css";

export function Catalog({ products }: { products: Product[] }) {
  const { query, setQuery, visible } = useProductSearch(products);

  return (
    <section aria-labelledby="catalog-heading">
      <h2 id="catalog-heading" className="visually-hidden">
        商品列表
      </h2>

      <input
        type="search"
        className={styles.search}
        placeholder="搜尋商品…"
        aria-label="搜尋商品"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* One always-mounted live region, so screen readers hear both count changes and the empty state. */}
      <p role="status" className={visible.length === 0 ? styles.empty : styles.count}>
        {visible.length === 0 ? "找不到符合條件的商品。" : `共 ${visible.length} 件商品`}
      </p>

      {visible.length > 0 && (
        <ul className={styles.grid}>
          {visible.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
