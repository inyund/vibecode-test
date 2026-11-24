import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { CartDrawer } from "@/components/CartDrawer";
import { Catalog } from "@/components/Catalog";
import { Header } from "@/components/Header";
import { PRODUCTS } from "@/data/products";
import { renderWithCart } from "@/test/render";

vi.mock("@/app/actions", () => ({ checkout: vi.fn() }));

const NAME = "無線藍牙耳機";

/** Adds 無線藍牙耳機 once via the catalog, then opens the drawer. */
async function renderOpenCart() {
  localStorage.clear();
  const utils = renderWithCart(
    <>
      <Header />
      <Catalog products={[...PRODUCTS]} />
      <CartDrawer />
    </>,
  );
  const card = screen.getByRole("heading", { name: NAME }).closest("article") as HTMLElement;
  await utils.user.click(within(card).getByRole("button", { name: "加入購物車" }));
  await utils.user.click(screen.getByRole("button", { name: /^開啟購物車/ }));
  return utils;
}

const drawer = () => screen.getByRole("dialog", { name: "購物車" });
const qtyInput = () => screen.getByRole("spinbutton", { name: `${NAME} 數量` }) as HTMLInputElement;
const plus = () => screen.getByRole("button", { name: `增加 ${NAME} 數量` });
const minus = () => screen.getByRole("button", { name: `減少 ${NAME} 數量` });
const removeDialog = () => screen.getByRole("heading", { name: "移除商品", hidden: true }).closest("dialog")!;

describe("Ticket 06: change quantity repeatedly or type it directly", () => {
  it("pressing + five times raises the quantity by 5 and the drawer stays open throughout", async () => {
    const { user } = await renderOpenCart();
    expect(qtyInput()).toHaveValue(1);
    for (let i = 1; i <= 5; i++) {
      await user.click(plus());
      expect(drawer()).toHaveAttribute("data-open", "true");
      expect(qtyInput()).toHaveValue(1 + i);
    }
  });

  it("pressing − repeatedly lowers the quantity each time with the drawer open", async () => {
    const { user } = await renderOpenCart();
    for (let i = 0; i < 4; i++) await user.click(plus());
    for (let i = 4; i >= 1; i--) {
      await user.click(minus());
      expect(drawer()).toHaveAttribute("data-open", "true");
      expect(qtyInput()).toHaveValue(i);
    }
  });

  it("accepts a typed quantity and clamps it to 99", async () => {
    const { user } = await renderOpenCart();
    await user.clear(qtyInput());
    await user.type(qtyInput(), "7{Enter}");
    expect(qtyInput()).toHaveValue(7);
    expect(drawer()).toHaveTextContent("共 7 件商品");

    await user.clear(qtyInput());
    await user.type(qtyInput(), "250{Enter}");
    expect(qtyInput()).toHaveValue(99);
    expect(drawer()).toHaveTextContent("共 99 件商品");
  });

  it.each([
    ["empty", ""],
    ["negative", "-3"],
  ])("rejects %s input and keeps the previous quantity", async (_label, value) => {
    const { user } = await renderOpenCart();
    await user.click(plus()); // quantity 2
    fireEvent.change(qtyInput(), { target: { value } });
    fireEvent.blur(qtyInput());
    expect(qtyInput()).toHaveValue(2);
    expect(drawer()).toHaveTextContent("共 2 件商品");
    expect(removeDialog()).not.toHaveAttribute("open");
  });

  // A number input reports typed non-numeric text as "", so this goes through the same reject path as empty input.
  it("rejects non-numeric typing", async () => {
    const { user } = await renderOpenCart();
    await user.type(qtyInput(), "abc");
    fireEvent.blur(qtyInput());
    expect(qtyInput()).toHaveValue(1);
    expect(drawer()).toHaveTextContent("共 1 件商品");
  });

  it("pressing − at quantity 1 asks for removal confirmation instead of removing", async () => {
    const { user } = await renderOpenCart();
    await user.click(minus());
    expect(removeDialog()).toHaveAttribute("open");
    expect(qtyInput()).toBeInTheDocument();
    expect(drawer()).toHaveAttribute("data-open", "true");
  });

  it("typing 0 asks for removal confirmation instead of removing", async () => {
    const { user } = await renderOpenCart();
    await user.clear(qtyInput());
    await user.type(qtyInput(), "0{Enter}");
    expect(removeDialog()).toHaveAttribute("open");
    expect(qtyInput()).toBeInTheDocument();
  });

  it("clicking the backdrop closes the drawer", async () => {
    const { user } = await renderOpenCart();
    const backdrop = document.querySelector('div[aria-hidden="true"][data-open]') as HTMLElement;
    await user.click(backdrop);
    expect(screen.getByRole("dialog", { name: "購物車", hidden: true })).toHaveAttribute("data-open", "false");
  });
});
