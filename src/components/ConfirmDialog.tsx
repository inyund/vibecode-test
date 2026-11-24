"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import styles from "./ConfirmDialog.module.css";

interface Props {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  danger?: boolean;
  /** Element to focus on close. Defaults to whatever had focus when the dialog opened. */
  returnFocus?: HTMLElement | null;
  /** Focused on close when the return target is gone (e.g. its cart line was just removed) or inert. */
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}

const focusable = (el: HTMLElement | null | undefined): el is HTMLElement =>
  !!el && el.isConnected && !el.closest("[inert]");

/** Reusable confirm dialog on native <dialog>: focus trap, Escape and top-layer come for free. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "取消",
  pending = false,
  danger = false,
  returnFocus,
  fallbackFocusRef,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const returnTo = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  const pressedBackdrop = useRef(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      if (dialog.open) return;
      const active = document.activeElement;
      returnTo.current =
        returnFocus ?? (active instanceof HTMLElement && active !== document.body ? active : null);
      wasOpen.current = true;
      dialog.showModal();
      confirmRef.current?.focus(); // explicit rather than relying on native autofocus
    } else if (wasOpen.current) {
      wasOpen.current = false;
      if (dialog.open) dialog.close();
      // The native <dialog> restores focus too, but not when the trigger was unmounted meanwhile.
      const target = [returnTo.current, fallbackFocusRef?.current].find(focusable);
      returnTo.current = null;
      target?.focus();
    }
  }, [open, returnFocus, fallbackFocusRef]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault(); // keep React state the single source of truth
        if (!pending) onCancel();
      }}
      // The browser may close it without a cancel event (repeated Escape); sync state back.
      onClose={() => {
        if (!open) return;
        if (pending) ref.current?.showModal(); // can't dismiss mid-request
        else onCancel();
      }}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        // Clicks on the ::backdrop land on the <dialog> element itself. Require the press to start
        // there too, so a text selection dragged out of the dialog doesn't dismiss it.
        if (e.target === e.currentTarget && pressedBackdrop.current && !pending) onCancel();
        pressedBackdrop.current = false;
      }}
    >
      <div className={styles.body}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children && <div className={styles.content}>{children}</div>}
        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.cancel}`} onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.button} ${danger ? styles.danger : styles.confirm}`}
            onClick={onConfirm}
            disabled={pending}
            ref={confirmRef}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
