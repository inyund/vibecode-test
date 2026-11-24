# 04: Show total cart quantity

**What to build:** The shopper can see how many units are in their cart — the sum of quantities, not the number of distinct products — on the header cart badge and in the cart drawer next to the total price. Count and price are derived together so they can never disagree.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] 2 × earphones + 1 × mouse shows 3 in both the badge and the drawer summary
- [x] Count and total come from one shared derivation of the cart lines
- [ ] Badge is hidden at 0 and shows 99+ above 99
- [x] The cart button's accessible label includes the count (e.g. 「開啟購物車，共 3 件商品」)
- [x] Unit tests cover the count/total derivation, including the empty cart
