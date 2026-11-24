import { memo, Profiler } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderWithCart } from "@/test/render";
import { useCart, useCartActions, type CartActions } from "@/components/cart/CartProvider";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/catalog/ProductCard";

vi.mock("@/app/actions", () => ({ checkout: vi.fn() }));

describe("Ticket 07: stable cart actions avoid needless re-renders", () => {
  it("keeps the same actions object across cart changes", async () => {
    const seen: CartActions[] = [];
    function Probe() {
      const actions = useCartActions();
      const { count } = useCart();
      seen.push(actions);
      return (
        <button type="button" onClick={() => actions.add(PRODUCTS[0])}>
          add {count}
        </button>
      );
    }
    const { user } = renderWithCart(<Probe />);
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("add 2");
    expect(seen.length).toBeGreaterThan(1);
    expect(new Set(seen).size).toBe(1);
  });

  it("does not re-render a memoized actions-only component when the cart changes", async () => {
    let actionRenders = 0;
    const ActionsOnly = memo(function ActionsOnly() {
      const { add } = useCartActions();
      actionRenders++;
      return (
        <button type="button" onClick={() => add(PRODUCTS[0])}>
          add
        </button>
      );
    });
    function Count() {
      return <output>{useCart().count}</output>;
    }
    const { user } = renderWithCart(
      <>
        <ActionsOnly />
        <Count />
      </>,
    );
    const before = actionRenders;
    await user.click(screen.getByRole("button", { name: "add" }));
    await user.click(screen.getByRole("button", { name: "add" }));
    expect(screen.getByRole("status")).toHaveTextContent("2");
    expect(actionRenders).toBe(before);
  });

  it("does not re-render the real ProductCard when the cart changes", async () => {
    const onRender = vi.fn();
    function Count() {
      return <output>{useCart().count}</output>;
    }
    const { user } = renderWithCart(
      <>
        <Profiler id="card" onRender={onRender}>
          <ProductCard product={PRODUCTS[0]} />
        </Profiler>
        <Count />
      </>,
    );
    const mountCommits = onRender.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "加入購物車" }));
    await user.click(screen.getByRole("button", { name: "加入購物車" }));
    expect(screen.getByRole("status")).toHaveTextContent("2");
    expect(onRender).toHaveBeenCalledTimes(mountCommits);
  });

  it("throws a clear error outside the provider", () => {
    function Bare() {
      useCartActions();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow("useCartActions must be used inside <CartProvider>");
    spy.mockRestore();
  });
});
