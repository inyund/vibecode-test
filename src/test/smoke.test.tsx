import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Shop } from "@/components/layout/Shop";
import { PRODUCTS } from "@/data/products";

// Server actions can't run in jsdom; ticket tests mock this module the same way.
vi.mock("@/app/actions", () => ({ checkout: vi.fn() }));

describe("test harness", () => {
  it("mounts the full Shop tree with the catalog", async () => {
    render(<Shop products={[...PRODUCTS]} />);
    expect(await screen.findAllByRole("article")).toHaveLength(PRODUCTS.length);
  });
});
