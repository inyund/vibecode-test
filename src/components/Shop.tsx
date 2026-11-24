"use client";

import type { Product } from "@/lib/types";
import { CartProvider } from "./CartProvider";
import { Header } from "./Header";
import { Catalog } from "./Catalog";
import { CartDrawer } from "./CartDrawer";
import { Toast } from "./Toast";

export function Shop({ products }: { products: Product[] }) {
  return (
    <CartProvider products={products}>
      <div className="container">
        <Header />
        <main>
          <Catalog products={products} />
        </main>
      </div>
      <CartDrawer />
      <Toast />
    </CartProvider>
  );
}
