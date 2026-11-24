import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PRODUCTS } from "@/data/products";
import { CartProvider } from "@/components/cart/CartProvider";
import type { Product } from "@/lib/types";

/** Render UI inside a CartProvider with the real catalog; returns a userEvent instance too. */
export function renderWithCart(ui: ReactElement, products: Product[] = [...PRODUCTS]) {
  const user = userEvent.setup();
  return { user, ...render(<CartProvider products={products}>{ui}</CartProvider>) };
}
