"use client";

import type { Product } from "@/lib/types";
import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/layout/Header";
import { Catalog } from "@/components/catalog/Catalog";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toast } from "@/components/ui/Toast";

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
