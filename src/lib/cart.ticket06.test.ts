import { describe, expect, it } from "vitest";
import { MAX_QUANTITY, cartReducer } from "./cart";

describe("Ticket 06: cart reducer quantity changes", () => {
  it("increments one at a time, so five adds raise the quantity by 5", () => {
    let state = cartReducer({}, { type: "add", id: 1 });
    for (let i = 0; i < 5; i++) state = cartReducer(state, { type: "add", id: 1 });
    expect(state[1]).toBe(6);
  });

  it("sets the quantity to N", () => {
    expect(cartReducer({ 1: 2 }, { type: "setQuantity", id: 1, quantity: 7 })).toEqual({ 1: 7 });
  });

  it("clamps to the max quantity", () => {
    expect(cartReducer({ 1: 2 }, { type: "setQuantity", id: 1, quantity: 500 })).toEqual({ 1: MAX_QUANTITY });
    expect(cartReducer({ 1: MAX_QUANTITY }, { type: "add", id: 1 })).toEqual({ 1: MAX_QUANTITY });
  });

  it("drops the line when the quantity reaches zero", () => {
    expect(cartReducer({ 1: 1, 2: 3 }, { type: "setQuantity", id: 1, quantity: 0 })).toEqual({ 2: 3 });
  });
});
