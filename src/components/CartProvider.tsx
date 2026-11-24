"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cartReducer, parseCart, summarize, toCartLines, type CartState } from "@/lib/cart";
import type { CartLine, Product } from "@/lib/types";

const STORAGE_KEY = "vibecode-shop:cart";
// Sentinel for "not yet loaded from storage": the persist effect skips it, so the initial
// empty render never overwrites a saved cart (also safe under StrictMode double effects).
const UNLOADED: CartState = Object.freeze({});

/** Stable callbacks: this object is created once, so components that only act on the cart never re-render. */
export interface CartActions {
  add: (product: Product) => void;
  setQuantity: (id: number, quantity: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  notify: (message: string) => void;
}

interface CartContextValue extends CartActions {
  lines: CartLine[];
  count: number;
  total: number;
  isOpen: boolean;
}

export type ToastMessage = { id: number; message: string };

const CartContext = createContext<CartContextValue | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);
// The toast lives in its own context: it changes twice per add (show, auto-dismiss), and only
// <Toast> reads it, so cart consumers don't re-render for it.
// `undefined` means "no provider" (useToast throws); `null` means "no toast showing".
const ToastContext = createContext<ToastMessage | null | undefined>(undefined);

const TOAST_DURATION_MS = 2500;

/** One toast at a time: a new message replaces the current one and restarts the dismiss timer. */
function useToastState() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const notify = useCallback((message: string) => {
    setToast((prev) => ({ id: (prev?.id ?? 0) + 1, message }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  return { toast, notify };
}

export function CartProvider({ products, children }: { products: Product[]; children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, UNLOADED);
  const [isOpen, setIsOpen] = useState(false);
  const { toast, notify } = useToastState();

  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Load persisted cart after mount (localStorage is unavailable during SSR).
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage blocked: start empty */
    }
    dispatch({ type: "hydrate", state: parseCart(saved) });
  }, []);

  useEffect(() => {
    if (state === UNLOADED) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage blocked or full: cart still works in memory */
    }
  }, [state]);

  const add = useCallback(
    (product: Product) => {
      dispatch({ type: "add", id: product.id });
      notify(`已將「${product.name}」加入購物車`);
    },
    [notify],
  );
  const setQuantity = useCallback((id: number, quantity: number) => dispatch({ type: "setQuantity", id, quantity }), []);
  const remove = useCallback((id: number) => dispatch({ type: "remove", id }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const actions = useMemo<CartActions>(
    () => ({ add, setQuantity, remove, clear, open, close, notify }),
    [add, setQuantity, remove, clear, open, close, notify],
  );

  const value = useMemo<CartContextValue>(() => {
    const lines = toCartLines(state, productsById);
    const { count, total } = summarize(lines);
    return { lines, count, total, isOpen, ...actions };
  }, [state, productsById, isOpen, actions]);

  return (
    <CartActionsContext.Provider value={actions}>
      <CartContext.Provider value={value}>
        <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
      </CartContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** Cart callbacks only. Prefer this over useCart() in components that don't display cart state. */
export function useCartActions(): CartActions {
  const ctx = useContext(CartActionsContext);
  if (!ctx) throw new Error("useCartActions must be used inside <CartProvider>");
  return ctx;
}

/** The current toast message (or null). Read by <Toast>; trigger one with `useCartActions().notify`. */
export function useToast(): ToastMessage | null {
  const toast = useContext(ToastContext);
  if (toast === undefined) throw new Error("useToast must be used inside <CartProvider>");
  return toast;
}
