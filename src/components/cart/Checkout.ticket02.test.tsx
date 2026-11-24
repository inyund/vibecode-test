import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { checkout } from "@/app/actions";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Catalog } from "@/components/catalog/Catalog";
import { Header } from "@/components/layout/Header";
import { Toast } from "@/components/ui/Toast";
import { PRODUCTS } from "@/data/products";
import type { CheckoutResult } from "@/lib/types";
import { renderWithCart } from "@/test/render";

vi.mock("@/app/actions", () => ({ checkout: vi.fn() }));

const STORAGE_KEY = "vibecode-shop:cart";
const mockCheckout = vi.mocked(checkout);

/** Cart: 無線藍牙耳機 (NT$ 2999) ×1 + 智慧手錶 (NT$ 8999) ×2 = 3 units, NT$ 20,997. Drawer open. */
async function renderOpenCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ 1: 1, 2: 2 }));
  const utils = renderWithCart(
    <>
      <Header />
      <Catalog products={[...PRODUCTS]} />
      <CartDrawer />
      <Toast />
    </>,
  );
  await utils.user.click(await screen.findByRole("button", { name: "開啟購物車，共 3 件商品" }));
  return utils;
}

const drawer = () => screen.getByRole("dialog", { name: "購物車" });
const checkoutDialog = () => {
  const dialog = screen.getByRole("heading", { name: "確認結帳", hidden: true }).closest("dialog");
  if (!dialog) throw new Error("No checkout dialog");
  return dialog;
};
const openCheckout = async (user: Awaited<ReturnType<typeof renderOpenCart>>["user"]) => {
  await user.click(within(drawer()).getByRole("button", { name: "結帳" }));
  expect(checkoutDialog()).toHaveAttribute("open");
};
const savedCart = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");

describe("Ticket 02: confirm before checkout", () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    mockCheckout.mockReset();
    alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
  });
  afterEach(() => {
    expect(alertSpy).not.toHaveBeenCalled(); // no alert() anywhere in the flow
    alertSpy.mockRestore();
  });

  it("checkout opens the confirmation dialog with unit count and NT$ total", async () => {
    const { user } = await renderOpenCart();
    expect(checkoutDialog()).not.toHaveAttribute("open");
    await openCheckout(user);
    expect(checkoutDialog()).toHaveTextContent("共 3 件商品");
    expect(checkoutDialog()).toHaveTextContent(/NT\$\s?20,?997/);
    expect(mockCheckout).not.toHaveBeenCalled();
  });

  it("Cancel and Escape dismiss without submitting", async () => {
    const { user } = await renderOpenCart();
    await openCheckout(user);
    await user.click(within(checkoutDialog()).getByRole("button", { name: "取消" }));
    expect(checkoutDialog()).not.toHaveAttribute("open");

    await openCheckout(user);
    fireEvent(checkoutDialog(), new Event("cancel", { cancelable: true })); // what Escape dispatches
    expect(checkoutDialog()).not.toHaveAttribute("open");

    await openCheckout(user);
    fireEvent.pointerDown(checkoutDialog()); // backdrop clicks land on the <dialog> itself
    fireEvent.click(checkoutDialog());
    expect(checkoutDialog()).not.toHaveAttribute("open");

    expect(mockCheckout).not.toHaveBeenCalled();
    expect(savedCart()).toEqual({ 1: 1, 2: 2 });
  });

  it("while submitting, Confirm is disabled with a pending label and a double-click submits once", async () => {
    let resolve!: (r: CheckoutResult) => void;
    mockCheckout.mockImplementation(() => new Promise((r) => (resolve = r)));
    const { user } = await renderOpenCart();
    await openCheckout(user);

    const confirmButton = within(checkoutDialog()).getByRole("button", { name: "確認結帳" });
    act(() => {
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton); // second click before React re-renders with isPending
    });

    const pendingButton = await within(checkoutDialog()).findByRole("button", { name: "處理中…" });
    expect(pendingButton).toBeDisabled();
    expect(within(checkoutDialog()).getByRole("button", { name: "取消" })).toBeDisabled();
    fireEvent(checkoutDialog(), new Event("cancel", { cancelable: true })); // Escape is ignored mid-request
    expect(checkoutDialog()).toHaveAttribute("open");
    fireEvent.click(pendingButton);
    expect(mockCheckout).toHaveBeenCalledTimes(1);
    expect(mockCheckout).toHaveBeenCalledWith([
      { id: 1, quantity: 1 },
      { id: 2, quantity: 2 },
    ]);

    await act(async () => resolve({ ok: true, orderId: "ORD-1", total: 20997 }));
  });

  it("success clears the cart and shows the result in-page", async () => {
    mockCheckout.mockResolvedValue({ ok: true, orderId: "ORD-TEST", total: 20997 });
    const { user } = await renderOpenCart();
    await openCheckout(user);
    await user.click(within(checkoutDialog()).getByRole("button", { name: "確認結帳" }));

    expect(await screen.findByText(/結帳成功！訂單 ORD-TEST/)).toBeInTheDocument();
    await waitFor(() => expect(savedCart()).toEqual({}));
    expect(screen.getByRole("button", { name: "開啟購物車，共 0 件商品" })).toBeInTheDocument();
    expect(checkoutDialog()).not.toHaveAttribute("open");
  });

  it("failure keeps the cart intact and shows the error in-page", async () => {
    mockCheckout.mockResolvedValue({ ok: false, error: "購物車內容有誤，請重新整理後再試。" });
    const { user } = await renderOpenCart();
    await openCheckout(user);
    await user.click(within(checkoutDialog()).getByRole("button", { name: "確認結帳" }));

    expect(await within(drawer()).findByRole("alert")).toHaveTextContent("購物車內容有誤");
    expect(savedCart()).toEqual({ 1: 1, 2: 2 });
    expect(within(drawer()).getAllByRole("listitem")).toHaveLength(2);
  });

  it("a network error keeps the cart and shows a retry message; Confirm works again afterwards", async () => {
    mockCheckout.mockRejectedValueOnce(new Error("offline"));
    const { user } = await renderOpenCart();
    await openCheckout(user);
    await user.click(within(checkoutDialog()).getByRole("button", { name: "確認結帳" }));

    expect(await within(drawer()).findByRole("alert")).toHaveTextContent("結帳失敗");
    expect(savedCart()).toEqual({ 1: 1, 2: 2 });

    mockCheckout.mockResolvedValueOnce({ ok: true, orderId: "ORD-2", total: 20997 });
    await openCheckout(user);
    await user.click(within(checkoutDialog()).getByRole("button", { name: "確認結帳" }));
    await waitFor(() => expect(mockCheckout).toHaveBeenCalledTimes(2));
  });
});
