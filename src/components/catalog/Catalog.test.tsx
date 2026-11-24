import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Catalog } from "@/components/catalog/Catalog";
import { PRODUCTS } from "@/data/products";
import { renderWithCart } from "@/test/render";

vi.mock("@/app/actions", () => ({ checkout: vi.fn() }));

function renderCatalog() {
  return renderWithCart(<Catalog products={[...PRODUCTS]} />);
}

describe("Ticket 05: search products by name", () => {
  it("has a search input with an accessible label", () => {
    renderCatalog();
    const input = screen.getByRole("searchbox", { name: "搜尋商品" });
    expect(input).toBeInTheDocument();
    expect(screen.getByLabelText("搜尋商品")).toBe(input);
  });

  it("shows every product and the total count initially", () => {
    renderCatalog();
    expect(screen.getAllByRole("article")).toHaveLength(PRODUCTS.length);
    expect(screen.getByRole("status")).toHaveTextContent(`共 ${PRODUCTS.length} 件商品`);
  });

  it("filters by name case-insensitively and updates the count", async () => {
    const { user } = renderCatalog();
    await user.type(screen.getByRole("searchbox", { name: "搜尋商品" }), "usb");

    expect(await screen.findByText("共 1 件商品")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("article")).toHaveTextContent("USB隨身碟");
  });

  it("matches the name only, not the description", async () => {
    const { user } = renderCatalog();
    // "快充" appears only in a description.
    await user.type(screen.getByRole("searchbox", { name: "搜尋商品" }), "快充");

    expect(await screen.findByText("找不到符合條件的商品。")).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("shows the empty state when nothing matches", async () => {
    const { user } = renderCatalog();
    await user.type(screen.getByRole("searchbox", { name: "搜尋商品" }), "zzz");

    expect(await screen.findByRole("status")).toHaveTextContent("找不到符合條件的商品。");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("restores every product when the box is cleared", async () => {
    const { user } = renderCatalog();
    const input = screen.getByRole("searchbox", { name: "搜尋商品" });
    await user.type(input, "無線");
    expect(await screen.findByText("共 2 件商品")).toBeInTheDocument();

    await user.clear(input);
    expect(await screen.findByText(`共 ${PRODUCTS.length} 件商品`)).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(PRODUCTS.length);
  });
});
