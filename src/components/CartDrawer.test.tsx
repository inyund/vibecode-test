import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { CartDrawer } from "@/components/CartDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Header } from "@/components/Header";
import { renderWithCart } from "@/test/render";

vi.mock("@/app/actions", () => ({ checkout: vi.fn() }));

const STORAGE_KEY = "vibecode-shop:cart";

/** Header + drawer with 無線藍牙耳機 (id 1, NT$ 2999) ×1 and 智慧手錶 (id 2, NT$ 8999) ×2, drawer open. */
async function renderOpenCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ 1: 1, 2: 2 }));
  const utils = renderWithCart(
    <>
      <Header />
      <CartDrawer />
    </>,
  );
  await utils.user.click(await screen.findByRole("button", { name: "開啟購物車，共 3 件商品" }));
  return utils;
}

const drawer = () => screen.getByRole("dialog", { name: "購物車" });
/** Found via its title: a closed <dialog> is outside the accessibility tree, so getByRole can't see it. */
const dialogTitled = (title: string) => {
  const dialog = screen.getByRole("heading", { name: title, hidden: true }).closest("dialog");
  if (!dialog) throw new Error(`No dialog titled ${title}`);
  return dialog;
};
const confirmDialog = () => dialogTitled("移除商品");
const cartLines = () => within(drawer()).queryAllByRole("listitem");
const savedCart = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");

describe("Ticket 01: confirm before removing a cart item", () => {
  it("Remove opens a modal dialog naming the product, with Remove / Cancel actions", async () => {
    const { user } = await renderOpenCart();
    expect(confirmDialog()).not.toHaveAttribute("open");

    await user.click(screen.getByRole("button", { name: "移除 無線藍牙耳機" }));

    const dialog = confirmDialog();
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveTextContent("確定要將「無線藍牙耳機」從購物車移除嗎？");
    expect(within(dialog).getByRole("button", { name: "移除" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("Confirm removes the line and the badge/total update accordingly", async () => {
    const { user } = await renderOpenCart();
    await user.click(screen.getByRole("button", { name: "移除 無線藍牙耳機" }));
    await user.click(within(confirmDialog()).getByRole("button", { name: "移除" }));

    expect(confirmDialog()).not.toHaveAttribute("open");
    expect(cartLines()).toHaveLength(1);
    expect(within(drawer()).queryByText("無線藍牙耳機")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "開啟購物車，共 2 件商品" })).toBeInTheDocument();
    expect(drawer()).toHaveTextContent("共 2 件商品");
    expect(drawer()).toHaveTextContent("總計: NT$ 17998");
    expect(savedCart()).toEqual({ 2: 2 });
  });

  describe("Cancel, Escape and clicking the backdrop all dismiss without changing the cart", () => {
    const dismissals: [string, (user: Awaited<ReturnType<typeof renderOpenCart>>["user"]) => Promise<void>][] = [
      ["Cancel", (user) => user.click(within(confirmDialog()).getByRole("button", { name: "取消" }))],
      [
        "Escape",
        async (user) => {
          // The keydown reaches the document first; the native dialog then fires `cancel`.
          await user.keyboard("{Escape}");
          fireEvent(confirmDialog(), new Event("cancel", { cancelable: true }));
        },
      ],
      [
        "backdrop click",
        async () => {
          // Clicks on ::backdrop target the <dialog> element itself.
          fireEvent.pointerDown(confirmDialog());
          fireEvent.click(confirmDialog());
        },
      ],
    ];

    it.each(dismissals)("%s", async (_, dismiss) => {
      const { user } = await renderOpenCart();
      await user.click(screen.getByRole("button", { name: "移除 無線藍牙耳機" }));
      await dismiss(user);

      expect(confirmDialog()).not.toHaveAttribute("open");
      expect(cartLines()).toHaveLength(2);
      expect(screen.getByRole("button", { name: "開啟購物車，共 3 件商品" })).toBeInTheDocument();
      expect(savedCart()).toEqual({ 1: 1, 2: 2 });
    });

    it("a press that starts inside the dialog and is released on the backdrop does not dismiss", async () => {
      const { user } = await renderOpenCart();
      await user.click(screen.getByRole("button", { name: "移除 無線藍牙耳機" }));
      fireEvent.pointerDown(screen.getByText(/確定要將/));
      fireEvent.click(confirmDialog());
      expect(confirmDialog()).toHaveAttribute("open");
    });

    it("pressing − at quantity 1 asks first, and Cancel keeps the line", async () => {
      const { user } = await renderOpenCart();
      await user.click(screen.getByRole("button", { name: "減少 無線藍牙耳機 數量" }));
      expect(confirmDialog()).toHaveAttribute("open");
      expect(confirmDialog()).toHaveTextContent("無線藍牙耳機");

      await user.click(within(confirmDialog()).getByRole("button", { name: "取消" }));
      expect(screen.getByRole("spinbutton", { name: "無線藍牙耳機 數量" })).toHaveValue(1);
    });

    it("typing 0 then Enter asks first instead of removing in the same keypress", async () => {
      const { user } = await renderOpenCart();
      const input = screen.getByRole("spinbutton", { name: "無線藍牙耳機 數量" });
      await user.clear(input);
      await user.type(input, "0{Enter}");

      expect(confirmDialog()).toHaveAttribute("open");
      expect(cartLines()).toHaveLength(2);

      await user.click(within(confirmDialog()).getByRole("button", { name: "取消" }));
      expect(input).toHaveValue(1);
      expect(input).toHaveFocus();
    });
  });

  describe("Focus moves into the dialog on open and returns to the triggering button on close", () => {
    it("focuses the Remove action on open and the trigger after Cancel", async () => {
      const { user } = await renderOpenCart();
      const trigger = screen.getByRole("button", { name: "移除 無線藍牙耳機" });
      await user.click(trigger);
      expect(within(confirmDialog()).getByRole("button", { name: "移除" })).toHaveFocus();

      await user.click(within(confirmDialog()).getByRole("button", { name: "取消" }));
      expect(trigger).toHaveFocus();
    });

    it("returns focus to the trigger even when the click didn't focus it (Safari/Firefox on macOS)", async () => {
      await renderOpenCart();
      const trigger = screen.getByRole("button", { name: "移除 智慧手錶" });
      fireEvent.click(trigger); // dispatches click without moving focus
      expect(trigger).not.toHaveFocus();
      fireEvent.click(within(confirmDialog()).getByRole("button", { name: "取消" }));
      expect(trigger).toHaveFocus();
    });

    it("returns focus to the − button that triggered it", async () => {
      await renderOpenCart();
      const minus = screen.getByRole("button", { name: "減少 無線藍牙耳機 數量" });
      fireEvent.click(minus); // no focus move, as in Safari/Firefox on macOS
      expect(minus).not.toHaveFocus();
      fireEvent(confirmDialog(), new Event("cancel", { cancelable: true }));
      expect(minus).toHaveFocus();
    });

    it("falls back to the drawer's close button when the trigger's line was removed", async () => {
      const { user } = await renderOpenCart();
      await user.click(screen.getByRole("button", { name: "移除 無線藍牙耳機" }));
      await user.click(within(confirmDialog()).getByRole("button", { name: "移除" }));
      expect(screen.getByRole("button", { name: "關閉購物車" })).toHaveFocus();
    });
  });

  it("Interacting with the dialog does not close the cart drawer", async () => {
    const { user } = await renderOpenCart();
    await user.click(screen.getByRole("button", { name: "移除 無線藍牙耳機" }));
    await user.keyboard("{Escape}");
    fireEvent(confirmDialog(), new Event("cancel", { cancelable: true }));
    fireEvent.pointerDown(confirmDialog());
    fireEvent.click(confirmDialog());
    expect(drawer()).toHaveAttribute("data-open", "true");

    await user.click(screen.getByRole("button", { name: "移除 無線藍牙耳機" }));
    await user.click(within(confirmDialog()).getByRole("button", { name: "移除" }));
    expect(drawer()).toHaveAttribute("data-open", "true");
  });

  describe("One generic confirmation component is used, not a one-off for removal", () => {
    it("renders any title, body and labels and reports confirm / cancel", async () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const { user, rerender } = renderWithCart(
        <ConfirmDialog open={false} title="任意標題" confirmLabel="好" onConfirm={onConfirm} onCancel={onCancel}>
          內容
        </ConfirmDialog>,
      );
      expect(dialogTitled("任意標題")).not.toHaveAttribute("open");

      rerender(
        <ConfirmDialog open title="任意標題" confirmLabel="好" onConfirm={onConfirm} onCancel={onCancel}>
          內容
        </ConfirmDialog>,
      );
      const dialog = screen.getByRole("dialog", { name: "任意標題" });
      expect(dialog).toHaveTextContent("內容");
      await user.click(within(dialog).getByRole("button", { name: "好" }));
      await user.click(within(dialog).getByRole("button", { name: "取消" }));
      expect(onConfirm).toHaveBeenCalledOnce();
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("gives each instance its own accessible name (checkout and removal share the component)", async () => {
      await renderOpenCart();
      const ids = ["確認結帳", "移除商品"].map((title) => {
        const dialog = dialogTitled(title);
        const id = dialog.getAttribute("aria-labelledby");
        expect(id && document.getElementById(id)).toHaveTextContent(title);
        return id;
      });
      expect(new Set(ids).size).toBe(2);
    });

    it("an open dialog is exposed as a dialog named by its title", async () => {
      const { user } = await renderOpenCart();
      await user.click(screen.getByRole("button", { name: "移除 無線藍牙耳機" }));
      expect(screen.getByRole("dialog", { name: "移除商品" })).toBe(confirmDialog());
    });
  });
});
