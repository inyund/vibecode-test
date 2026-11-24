import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { Toast } from "@/components/ui/Toast";
import { PRODUCTS } from "@/data/products";

const [first, second] = PRODUCTS;

/** Minimal add buttons wired to the real cart context, so the test stays independent of Catalog. */
function AddButtons() {
  const { add } = useCart();
  return (
    <>
      {[first, second].map((p) => (
        <button key={p.id} onClick={() => add(p)}>
          add {p.id}
        </button>
      ))}
    </>
  );
}

function setup() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <CartProvider products={[...PRODUCTS]}>
      <AddButtons />
      <Toast />
    </CartProvider>,
  );
  return { user, region: screen.getByRole("status") };
}

const addedMessage = (name: string) => `已將「${name}」加入購物車`;

describe("Ticket 03: notify when an item is added", () => {
  beforeEach(() => {
    // shouldAdvanceTime keeps React/Testing Library's internal async work moving; the
    // explicit advanceTimersByTime steps below still control the 2.5s dismiss timer. The
    // checks sit 500ms either side of it, so real time leaking in can't flip a result.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a notification naming the product after each add", async () => {
    const { user, region } = setup();
    expect(region).toBeEmptyDOMElement();

    await user.click(screen.getByRole("button", { name: `add ${first.id}` }));
    expect(region).toHaveTextContent(addedMessage(first.name));
  });

  it("dismisses itself after roughly 2–3 seconds", async () => {
    const { user, region } = setup();
    await user.click(screen.getByRole("button", { name: `add ${first.id}` }));

    act(() => vi.advanceTimersByTime(2000));
    expect(region).toHaveTextContent(addedMessage(first.name));

    act(() => vi.advanceTimersByTime(1000));
    expect(region).toBeEmptyDOMElement();
  });

  it("replaces the message and restarts the timer on a repeat add, without stacking", async () => {
    const { user, region } = setup();
    await user.click(screen.getByRole("button", { name: `add ${first.id}` }));
    const box = region.firstElementChild;

    act(() => vi.advanceTimersByTime(1500));
    await user.click(screen.getByRole("button", { name: `add ${second.id}` }));

    expect(region.children).toHaveLength(1);
    // Same box element: no remount, so no re-running entrance animation (no flicker).
    expect(region.firstElementChild).toBe(box);
    expect(region).toHaveTextContent(addedMessage(second.name));
    expect(region).not.toHaveTextContent(first.name);

    // 2s after the second add = 3.5s after the first: still visible, so the timer restarted.
    act(() => vi.advanceTimersByTime(2000));
    expect(region).toHaveTextContent(addedMessage(second.name));

    act(() => vi.advanceTimersByTime(1000));
    expect(region).toBeEmptyDOMElement();
  });

  it("re-renders the text for an identical repeat add so it is announced again", async () => {
    const { user, region } = setup();
    const button = screen.getByRole("button", { name: `add ${first.id}` });
    await user.click(button);
    const text = screen.getByText(addedMessage(first.name));

    await user.click(button);
    expect(screen.getByText(addedMessage(first.name))).not.toBe(text);
    expect(region.children).toHaveLength(1);
  });

  it("is a polite live region and never takes focus", async () => {
    const { user, region } = setup();
    expect(region).toHaveAttribute("aria-live", "polite");

    const button = screen.getByRole("button", { name: `add ${first.id}` });
    await user.click(button);
    expect(button).toHaveFocus();
    expect(region.querySelector("[tabindex], button, a, input")).toBeNull();
  });
});
