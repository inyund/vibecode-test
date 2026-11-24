"use client";

import { useToast } from "@/components/cart/CartProvider";
import styles from "./Toast.module.css";

export function Toast() {
  const toast = useToast();
  // The live region stays mounted so screen readers reliably announce each new message.
  // The toast box itself is not keyed: a repeat add while it is visible keeps the same box
  // (no re-running entrance animation, no flicker). Only the text is keyed by id, so even an
  // identical message is replaced in the DOM and announced again.
  return (
    <div className={styles.region} role="status" aria-live="polite" aria-atomic="true">
      {toast && (
        <div className={styles.toast}>
          <span aria-hidden="true">✓</span> <span key={toast.id}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
