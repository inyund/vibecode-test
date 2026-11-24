"use server";

import { getProductById } from "@/lib/catalog";
import { MAX_QUANTITY } from "@/lib/cart";
import type { CheckoutResult } from "@/lib/types";

/**
 * Checkout runs on the server and re-prices every line from the catalog,
 * so client-side state (incl. tampered localStorage) can't change the total.
 */
export async function checkout(items: { id: number; quantity: number }[]): Promise<CheckoutResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "購物車是空的！" };
  }

  let total = 0;
  for (const item of items) {
    const product = getProductById(Number(item?.id));
    const quantity = Number(item?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return { ok: false, error: "購物車內容有誤，請重新整理後再試。" };
    }
    total += product.price * quantity;
  }

  await new Promise((resolve) => setTimeout(resolve, 1200)); // simulated payment latency

  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  return { ok: true, orderId, total };
}
