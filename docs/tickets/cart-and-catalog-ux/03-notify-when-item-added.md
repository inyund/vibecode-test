# 03: Notify when an item is added to the cart

**What to build:** Every time the shopper adds a product, a short non-blocking notification confirms it by name (e.g. 「已將「無線藍牙耳機」加入購物車」) and disappears on its own. Rapid repeated adds update the single notification instead of piling up.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A notification naming the product appears after each add
- [x] It dismisses itself after roughly 2–3 seconds
- [x] Adding again while it is visible replaces the message and restarts the timer; no stacking or flicker
- [x] It is announced to screen readers politely and never takes focus
- [x] Its animation respects the reduced-motion preference
