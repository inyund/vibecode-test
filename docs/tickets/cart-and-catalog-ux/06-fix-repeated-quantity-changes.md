# 06: Fix: change quantity repeatedly or type it directly

**What to build:** The shopper can adjust a cart line's quantity as many times in a row as they like without the cart closing, and can type a quantity directly.

Background: in the legacy page each +/- click re-rendered the cart list, so the click reached the document-level "click outside closes the cart" handler with a target no longer in the page; the handler concluded the click was outside and closed the cart after every click. There was also no way to type a quantity. The fix must not rely on inspecting the click target of a document-wide listener; closing on outside click should come from an explicit backdrop.

**Blocked by:** 01 (Confirm before removing a cart item) — dropping to zero reuses its removal confirmation

**Status:** done

- [x] Pressing + five times in a row raises the quantity by 5 and the drawer stays open throughout
- [x] Pressing − repeatedly lowers the quantity each time with the drawer open
- [x] The shopper can type a quantity; empty, non-numeric or negative input is rejected, and values are clamped to a max of 99
- [x] Lowering a quantity to 0 (via − or typing) asks for the removal confirmation instead of removing silently
- [x] Clicking the backdrop still closes the drawer
- [x] Cart logic unit tests cover increment, set-to-N, clamp-to-max and drop-to-zero
