import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/products";
import { filterProductsByName } from "./search";

describe("Ticket 05: filterProductsByName", () => {
  it("returns every product for a blank or whitespace query", () => {
    expect(filterProductsByName(PRODUCTS, "")).toHaveLength(PRODUCTS.length);
    expect(filterProductsByName(PRODUCTS, "   ")).toHaveLength(PRODUCTS.length);
  });

  it("matches the name case-insensitively", () => {
    expect(filterProductsByName(PRODUCTS, "usb").map((p) => p.id)).toEqual([7]);
    expect(filterProductsByName(PRODUCTS, "  UsB ").map((p) => p.id)).toEqual([7]);
  });

  it("matches substrings of the name", () => {
    expect(filterProductsByName(PRODUCTS, "無線").map((p) => p.id)).toEqual([1, 4]);
  });

  it("ignores the description", () => {
    // "快充" and "RGB" only appear in descriptions.
    expect(filterProductsByName(PRODUCTS, "快充")).toEqual([]);
    expect(filterProductsByName(PRODUCTS, "rgb")).toEqual([]);
  });
});
