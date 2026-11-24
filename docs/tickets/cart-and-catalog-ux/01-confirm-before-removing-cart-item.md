# 01: Confirm before removing a cart item

**What to build:** When the shopper chooses to remove a line from the cart, a confirmation dialog names the product and asks them to confirm. Confirming removes the line; backing out leaves the cart exactly as it was. The dialog is a single reusable confirmation component that later tickets (checkout, dropping quantity to zero) also use.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Remove opens a modal dialog naming the product, with Remove / Cancel actions
- [x] Confirm removes the line and the badge/total update accordingly
- [x] Cancel, Escape and clicking the backdrop all dismiss without changing the cart
- [x] Focus moves into the dialog on open and returns to the triggering button on close
- [x] Interacting with the dialog does not close the cart drawer
- [x] One generic confirmation component is used, not a one-off for removal
