/** Legacy display format: "NT$ 2999" (no thousands separator). */
export function formatPrice(value: number): string {
  return `NT$ ${Math.round(value)}`;
}
