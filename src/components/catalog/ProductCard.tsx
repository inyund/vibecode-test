"use client";

import { memo } from "react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCartActions } from "@/components/cart/CartProvider";
import styles from "./ProductCard.module.css";

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const { add } = useCartActions();

  return (
    <article className={styles.card}>
      <div className={styles.image} aria-hidden="true">
        圖片載入中...
      </div>
      <h3 className={styles.title}>{product.name}</h3>
      <p className={styles.price}>{formatPrice(product.price)}</p>
      <button type="button" className={styles.add} onClick={() => add(product)}>
        加入購物車
      </button>
    </article>
  );
});
