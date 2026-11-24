# 05: Search products by name

**What to build:** A labelled search box above the product grid lets the shopper narrow the catalogue as they type. Matching is case-insensitive on the product name. The grid shows how many products match, a friendly empty state when none do, and the full list again when the box is cleared. (The legacy page had a search function but no input wired to it.)

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Typing filters the grid by product name, case-insensitively
- [x] Typing stays responsive (filtering is deferred or debounced, not a full re-render per keystroke)
- [x] A result count is shown; zero matches shows 「找不到符合條件的商品。」
- [x] Clearing the box restores every product
- [x] The input has an accessible label
