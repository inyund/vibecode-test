# 07: Review fixes: needless re-renders and small-screen layout

**What to build:** Fix the top findings from the whole-codebase rubric review.

- Product cards re-render on every cart change, because they read the whole cart context. Cart actions should come from a stable context, so memoized cards skip re-rendering. Remove the unused `quantityOf`.
- Below 1200px the page scrolls sideways (legacy 問題1). On phones, the 400px cart drawer runs off-screen.

Desktop (≥1200px) must look exactly like `legacy/index.html`.

**Blocked by:** None (can start immediately). It doesn't touch `CartDrawer.tsx`, which tickets 01/02/06 own.

**Status:** done

- [x] Cart actions (`add`, `setQuantity`, `remove`, `clear`, `open`, `close`, `notify`) come from a context whose value never changes after mount; `ProductCard` reads only that
- [x] Adding an item does not re-render product cards whose product didn't change
- [x] The unused `quantityOf` is removed
- [x] `.container` is `max-width: 1200px` with fluid width: same at ≥1200px, no horizontal scroll from 769–1199px
- [x] At ≤768px the drawer is full-width and fully on-screen when open, and fully hidden when closed
- [x] Tests cover the stable actions context and the re-render behaviour
