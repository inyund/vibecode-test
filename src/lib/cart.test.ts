import { describe, expect, it } from "vitest";
import { cartReducer, formatBadgeCount, MAX_QUANTITY, parseCart, summarize, toCartLines } from "@/lib/cart";
import { PRODUCTS } from "@/data/products";

const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

describe("cartReducer", () => {
  it("adds and increments", () => {
    let s = cartReducer({}, { type: "add", id: 1 });
    s = cartReducer(s, { type: "add", id: 1 });
    expect(s).toEqual({ 1: 2 });
  });

  it("removes a line when quantity drops to zero", () => {
    const s = cartReducer({ 1: 1, 2: 3 }, { type: "setQuantity", id: 1, quantity: 0 });
    expect(s).toEqual({ 2: 3 });
  });

  it("clamps to MAX_QUANTITY", () => {
    const s = cartReducer({}, { type: "setQuantity", id: 1, quantity: 1000 });
    expect(s[1]).toBe(MAX_QUANTITY);
  });

  it("does not mutate the previous state", () => {
    const prev = { 1: 1 };
    cartReducer(prev, { type: "add", id: 1 });
    expect(prev).toEqual({ 1: 1 });
  });
});

describe("selectors", () => {
  it("drops unknown ids and totals with catalog prices", () => {
    const lines = toCartLines({ 1: 2, 999: 5 }, byId);
    expect(lines).toHaveLength(1);
    expect(summarize(lines)).toEqual({ count: 2, total: 2999 * 2 });
  });
});

describe("parseCart", () => {
  it.each([null, "", "not json", "[1,2]", '"x"'])("returns empty for %s", (raw) => {
    expect(parseCart(raw)).toEqual({});
  });

  it("ignores invalid entries", () => {
    expect(parseCart('{"1":2,"x":3,"2":"4","3":-1}')).toEqual({ 1: 2 });
  });
});

describe("cart quantity (ticket 04)", () => {
  it("summarizes an empty cart as zero count and zero total", () => {
    expect(summarize(toCartLines({}, byId))).toEqual({ count: 0, total: 0 });
    expect(summarize([])).toEqual({ count: 0, total: 0 });
  });

  it("counts units, not distinct products: 2 × earphones + 1 × mouse = 3", () => {
    const lines = toCartLines({ 1: 2, 4: 1 }, byId);
    expect(lines).toHaveLength(2);
    expect(summarize(lines)).toEqual({ count: 3, total: 2999 * 2 + 899 });
  });

  it("derives count and total from the same lines across several products", () => {
    const lines = toCartLines({ 1: 99, 2: 99 }, byId);
    expect(summarize(lines)).toEqual({ count: 198, total: (2999 + 8999) * 99 });
  });

  it.each([
    [0, "0"],
    [1, "1"],
    [99, "99"],
    [100, "99+"],
    [198, "99+"],
  ])("formats badge count %i as %s", (count, text) => {
    expect(formatBadgeCount(count)).toBe(text);
  });
});
