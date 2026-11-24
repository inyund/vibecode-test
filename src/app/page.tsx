import { getProducts } from "@/lib/catalog";
import { Shop } from "@/components/Shop";

// Server Component: products are fetched on the server; loading.tsx / error.tsx
// cover the pending and failure states.
export default async function Home() {
  const products = await getProducts();
  return <Shop products={products} />;
}
