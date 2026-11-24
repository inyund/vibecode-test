# 02: Confirm before checkout

**What to build:** Pressing checkout first shows a confirmation dialog summarising the order (total units and total price in NT$). Confirming submits the order; while it is in flight the shopper can't submit again. The result, success or failure, is shown in the page rather than a browser alert, and the cart is cleared only when checkout succeeds.

**Blocked by:** 01 (Confirm before removing a cart item) — reuses its confirmation dialog

**Status:** done

- [x] Checkout opens the confirmation dialog showing unit count and total price
- [x] Cancel / Escape / backdrop dismiss without submitting
- [x] While submitting, Confirm is disabled and shows a pending label; double-clicking cannot submit twice
- [x] Success is shown in-page and the cart is cleared
- [x] Failure is shown in-page and the cart is left intact
- [x] No `alert()` is used anywhere in the checkout flow
