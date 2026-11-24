import type { CartLine, Product } from "@/lib/types";

/** Cart stores only ids + quantities; product data (and price) always comes from the catalog. */
export type CartState = Readonly<Record<number, number>>;

export const MAX_QUANTITY = 99;

export type CartAction =
  | { type: "add"; id: number }
  | { type: "setQuantity"; id: number; quantity: number }
  | { type: "remove"; id: number }
  | { type: "clear" }
  | { type: "hydrate"; state: CartState };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add":
      return withQuantity(state, action.id, (state[action.id] ?? 0) + 1);
    case "setQuantity":
      return withQuantity(state, action.id, action.quantity);
    case "remove":
      return withQuantity(state, action.id, 0);
    case "clear":
      return {};
    case "hydrate":
      return action.state;
  }
}

function withQuantity(state: CartState, id: number, quantity: number): CartState {
  const next = { ...state };
  const q = Math.min(Math.floor(quantity), MAX_QUANTITY);
  if (q > 0) next[id] = q;
  else delete next[id];
  return next;
}

/** Resolve stored ids against the catalog, dropping ids that no longer exist. */
export function toCartLines(state: CartState, productsById: ReadonlyMap<number, Product>): CartLine[] {
  const lines: CartLine[] = [];
  for (const [id, quantity] of Object.entries(state)) {
    const product = productsById.get(Number(id));
    if (product) lines.push({ product, quantity });
  }
  return lines;
}

/** Count (sum of quantities) and total price, derived together in one pass so they can't disagree. */
export function summarize(lines: readonly CartLine[]) {
  let count = 0;
  let total = 0;
  for (const { product, quantity } of lines) {
    count += quantity;
    total += product.price * quantity;
  }
  return { count, total };
}

export const BADGE_MAX = 99;

/** Text for the header cart badge: the count, capped as "99+" above BADGE_MAX. */
export function formatBadgeCount(count: number): string {
  return count > BADGE_MAX ? `${BADGE_MAX}+` : String(count);
}

/** Parse untrusted persisted data (localStorage) into a valid CartState. */
export function parseCart(raw: string | null): CartState {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
    let state: CartState = {};
    for (const [id, qty] of Object.entries(data)) {
      const n = Number(id);
      if (Number.isInteger(n) && typeof qty === "number" && Number.isFinite(qty)) {
        state = withQuantity(state, n, qty);
      }
    }
    return state;
  } catch {
    return {};
  }
}
