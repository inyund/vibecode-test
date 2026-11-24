"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { checkout } from "@/app/actions";
import { MAX_QUANTITY } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/lib/types";
import { useCart } from "@/components/cart/CartProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import styles from "./CartDrawer.module.css";

// `trigger` is where focus returns when the dialog closes (if it still exists). Passed explicitly:
// Safari and Firefox on macOS do not focus a button on mouse click.
type Pending = { kind: "checkout" } | { kind: "remove"; line: CartLine; trigger?: HTMLElement } | null;

export function CartDrawer() {
  const { lines, count, total, isOpen, close, setQuantity, remove, clear, notify } = useCart();
  const [confirm, setConfirm] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, startCheckout] = useTransition();
  const submittingRef = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes the drawer (unless a dialog is handling it), body scroll is locked while open,
  // and focus moves in on open and back to the cart button on close.
  useEffect(() => {
    if (!isOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus?.();
    };
  }, [isOpen, close]);

  const requestQuantity = (line: CartLine, quantity: number, trigger?: HTMLElement) => {
    if (quantity <= 0) setConfirm({ kind: "remove", line, trigger });
    else setQuantity(line.product.id, quantity);
  };

  const runCheckout = () => {
    // isPending only updates after a re-render, so a fast double-click could submit twice without this.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    startCheckout(async () => {
      try {
        const result = await checkout(lines.map((l) => ({ id: l.product.id, quantity: l.quantity })));
        if (result.ok) {
          clear();
          setConfirm(null);
          close();
          notify(`結帳成功！訂單 ${result.orderId}，共 ${formatPrice(result.total)}`);
        } else {
          setConfirm(null);
          setError(result.error);
        }
      } catch {
        setConfirm(null);
        setError("結帳失敗，請檢查網路連線後再試一次。");
      } finally {
        submittingRef.current = false;
      }
    });
  };

  return (
    <>
      <div className={styles.backdrop} data-open={isOpen} onClick={close} aria-hidden="true" />
      <aside
        className={styles.drawer}
        data-open={isOpen}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        inert={!isOpen}
      >
        <div className={styles.head}>
          <h2 id="cart-title">購物車</h2>
          <button ref={closeRef} type="button" className={styles.close} onClick={close} aria-label="關閉購物車">
            ×
          </button>
        </div>

        {lines.length === 0 ? (
          <p className={styles.empty}>購物車是空的</p>
        ) : (
          <ul className={styles.items}>
            {lines.map((line) => (
              <CartItem
                key={line.product.id}
                line={line}
                onQuantity={(q, trigger) => requestQuantity(line, q, trigger)}
                onRemove={(trigger) => setConfirm({ kind: "remove", line, trigger })}
              />
            ))}
          </ul>
        )}

        <div className={styles.summary}>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <div className={styles.count}>共 {count} 件商品</div>
          <div className={styles.total}>總計: {formatPrice(total)}</div>
          <button
            type="button"
            className={styles.checkout}
            disabled={lines.length === 0 || isCheckingOut}
            onClick={() => setConfirm({ kind: "checkout" })}
          >
            {isCheckingOut ? "處理中…" : "結帳"}
          </button>
        </div>
      </aside>

      <ConfirmDialog
        open={confirm?.kind === "checkout"}
        title="確認結帳"
        confirmLabel={isCheckingOut ? "處理中…" : "確認結帳"}
        pending={isCheckingOut}
        onConfirm={runCheckout}
        onCancel={() => setConfirm(null)}
      >
        共 {count} 件商品，總計 <strong>{formatPrice(total)}</strong>。確定要送出訂單嗎？
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === "remove"}
        title="移除商品"
        confirmLabel="移除"
        danger
        returnFocus={confirm?.kind === "remove" ? confirm.trigger : undefined}
        fallbackFocusRef={closeRef}
        onConfirm={() => {
          if (confirm?.kind === "remove") remove(confirm.line.product.id);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      >
        確定要將「{confirm?.kind === "remove" ? confirm.line.product.name : ""}」從購物車移除嗎？
      </ConfirmDialog>
    </>
  );
}

function CartItem({
  line,
  onQuantity,
  onRemove,
}: {
  line: CartLine;
  onQuantity: (quantity: number, trigger?: HTMLElement) => void;
  onRemove: (trigger: HTMLElement) => void;
}) {
  const { product, quantity } = line;
  // Local draft so the user can clear the field and type a new number before committing.
  const [draft, setDraft] = useState(String(quantity));
  const [prevQuantity, setPrevQuantity] = useState(quantity);
  if (prevQuantity !== quantity) {
    setPrevQuantity(quantity);
    setDraft(String(quantity));
  }

  // Reads the input's live value so a blur fired right after typing can't see a stale draft.
  const commit = (input: HTMLInputElement) => {
    const raw = input.value;
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n) || n < 0) {
      setDraft(String(quantity)); // empty, non-numeric or negative: reject and revert
      return;
    }
    const clamped = Math.min(Math.max(Math.floor(n), 0), MAX_QUANTITY);
    setDraft(String(clamped === 0 ? quantity : clamped));
    if (clamped !== quantity) onQuantity(clamped, input);
  };

  return (
    <li className={styles.item}>
      <div className={styles.thumb} aria-hidden="true">
        圖片
      </div>
      <div className={styles.details}>
        <div className={styles.name}>{product.name}</div>
        <div className={styles.price}>{formatPrice(product.price)}</div>
        <div className={styles.qty}>
          <button type="button" onClick={(e) => onQuantity(quantity - 1, e.currentTarget)} aria-label={`減少 ${product.name} 數量`}>
            -
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_QUANTITY}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              // Without preventDefault the same Enter activates the Remove button the dialog focuses on open.
              e.preventDefault();
              e.currentTarget.blur();
            }}
            aria-label={`${product.name} 數量`}
          />
          <button
            type="button"
            onClick={() => onQuantity(quantity + 1)}
            disabled={quantity >= MAX_QUANTITY}
            aria-label={`增加 ${product.name} 數量`}
          >
            +
          </button>
        </div>
      </div>
      <button type="button" className={styles.remove} onClick={(e) => onRemove(e.currentTarget)} aria-label={`移除 ${product.name}`}>
        移除
      </button>
    </li>
  );
}
