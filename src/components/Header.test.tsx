import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { Catalog } from "@/components/Catalog";
import { Header } from "@/components/Header";
import { PRODUCTS } from "@/data/products";
import { renderWithCart } from "@/test/render";

const STORAGE_KEY = "vibecode-shop:cart";

function renderShop() {
  return renderWithCart(
    <>
      <Header />
      <Catalog products={[...PRODUCTS]} />
    </>,
  );
}

function cartButton() {
  return screen.getByRole("button", { name: /^開啟購物車/ });
}

function addButtonFor(productName: string) {
  const card = screen.getByRole("heading", { name: productName }).closest("article");
  if (!card) throw new Error(`No product card for ${productName}`);
  return within(card).getByRole("button", { name: "加入購物車" });
}

describe("Ticket 04: show total cart quantity", () => {
  it("shows 0 in the badge and the label for an empty cart (legacy always-visible badge)", () => {
    renderShop();
    expect(cartButton()).toHaveAccessibleName("開啟購物車，共 0 件商品");
    expect(cartButton()).toHaveTextContent(/0$/);
  });

  it("2 × earphones + 1 × mouse shows 3 units in the badge and the accessible label", async () => {
    const { user } = renderShop();
    await user.click(addButtonFor("無線藍牙耳機"));
    await user.click(addButtonFor("無線藍牙耳機"));
    await user.click(addButtonFor("無線滑鼠"));

    expect(cartButton()).toHaveAccessibleName("開啟購物車，共 3 件商品");
    expect(cartButton()).toHaveTextContent(/3$/);
  });

  it("shows exactly 99 without capping", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 1: 98 }));
    const { user } = renderShop();
    expect(await screen.findByRole("button", { name: "開啟購物車，共 98 件商品" })).toBeInTheDocument();
    await user.click(addButtonFor("無線滑鼠"));

    expect(cartButton()).toHaveAccessibleName("開啟購物車，共 99 件商品");
    expect(cartButton()).toHaveTextContent(/99$/);
    expect(cartButton()).not.toHaveTextContent("99+");
  });

  it("shows 99+ in the badge above 99 while the label keeps the full count", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 1: 99 }));
    const { user } = renderShop();
    expect(await screen.findByRole("button", { name: "開啟購物車，共 99 件商品" })).toBeInTheDocument();
    await user.click(addButtonFor("無線滑鼠"));

    expect(cartButton()).toHaveAccessibleName("開啟購物車，共 100 件商品");
    expect(cartButton()).toHaveTextContent(/99\+$/);
  });
});
