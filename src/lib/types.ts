export type Category = "audio" | "wearable" | "accessory" | "peripheral";

export interface Product {
  id: number;
  name: string;
  price: number; // NT$, integer
  category: Category;
  emoji: string; // placeholder artwork until real images exist
  description: string;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export type CheckoutResult =
  | { ok: true; orderId: string; total: number }
  | { ok: false; error: string };
