"use client";

import { formatBadgeCount } from "@/lib/cart";
import { useCart } from "@/components/cart/CartProvider";
import styles from "./Header.module.css";

export function Header() {
  const { count, open } = useCart();
  return <HeaderView count={count} onOpen={open} />;
}

/** Presentational header, also used by the loading state (which has no cart context). */
export function HeaderView({ count, onOpen }: { count: number; onOpen?: () => void }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>精品商店</h1>
      <button
        type="button"
        className={styles.cartButton}
        onClick={onOpen}
        aria-label={`開啟購物車，共 ${count} 件商品`}
        data-cart-trigger
      >
        🛒 購物車
        <span className={styles.badge} aria-hidden="true">
          {formatBadgeCount(count)}
        </span>
      </button>
    </header>
  );
}
