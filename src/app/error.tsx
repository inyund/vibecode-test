"use client";

import styles from "./status.module.css";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className={`container ${styles.error}`}>
      <h1>無法載入商品</h1>
      <p>請檢查網路連線後再試一次。</p>
      <button type="button" onClick={reset}>
        重新載入
      </button>
    </main>
  );
}
