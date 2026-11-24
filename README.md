# 精品商店 — Storefront (Next.js)

A small storefront: a product catalog with search, a cart drawer and checkout. The UI is in Traditional Chinese and prices are in NT$. It started as a single, deliberately flawed HTML/CSS/JS page ([`legacy/index.html`](legacy/index.html)), which was migrated to **Next.js 16 + React 19 + TypeScript**. The visual design is the same as the legacy page.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3000. To compare with the original, open `legacy/index.html` directly in a browser.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest, all tests |
| `npx vitest run src/lib/cart.test.ts -t "clamps"` | One test file / one test by name |

## Features

- **Catalog with search:** case-insensitive name search with a result count and an empty state. Filtering is deferred, so typing stays responsive.
- **Add-to-cart notification:** a toast names the product. A repeated add replaces the message instead of stacking.
- **Cart drawer:** `+`/`−` can be pressed repeatedly and the drawer stays open. You can also type a quantity, clamped to 1–99. The badge shows the total units.
- **Confirmations:** removing an item, including dropping its quantity to 0, and checking out both ask first through a reusable dialog.
- **Checkout:** a Server Action re-prices every line on the server. Confirm shows a pending state, double submits are blocked, and success or failure is shown in the page.
- **Persistence:** the cart survives reloads (localStorage, validated on load).

## Project structure

```
src/
  app/              layout, page (Server Component), loading/error states, server actions
  components/
    cart/           CartProvider (context + reducer), CartDrawer, checkout
    catalog/        Catalog (search + grid), ProductCard
    layout/         Header, Shop (client shell)
    ui/             ConfirmDialog, Toast (generic)
  lib/              pure logic: cart reducer & selectors, search, formatting, types
  data/             product catalog
  test/             Vitest setup and render helpers
docs/tickets/       feature tickets (cart-and-catalog-ux/01–07)
legacy/index.html   the original single-file page (visual reference)
```

## Architecture

- **Data:** `app/page.tsx` loads products on the server (`lib/catalog.ts`, `server-only`) and passes them to the client tree. `loading.tsx` and `error.tsx` cover the pending and failure states.
- **State:** a single `CartProvider` (React context + `useReducer`). The cart holds only `{ productId: quantity }`, and product data and prices always come from the catalog. There are three contexts:
  - cart state, read with `useCart()`
  - stable actions, read with `useCartActions()`, so components that only act on the cart (such as product cards) don't re-render
  - the toast, read with `useToast()`
- **Logic** that can be tested without React lives in `src/lib/` (reducer, selectors, `parseCart`, search).
- **Styling:** CSS Modules per component, using the legacy page's values. Below 1200px the layout is fluid, and below 768px the drawer is full-width.

## Testing

Vitest with jsdom and Testing Library. Each ticket has its own tests (`describe("Ticket NN: …")`), next to the code they cover. `src/test/setup.ts` polyfills `<dialog>`, and `renderWithCart()` in `src/test/render.tsx` renders UI inside a `CartProvider`.

## Contributing

Work is ticket-driven: tickets live in `docs/tickets/`, and each change ships with tests. Before opening a PR, run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. Commits follow Conventional Commits (`feat(cart): …`, `refactor(components): …`).

## Legacy issues addressed

The original page marked 16 known problems (`問題1–16`): fixed width, float layout, global variables, no error handling, repeated DOM queries, no throttling, cart closing on every `+`/`−` click, and more. The migration addresses most of them with React components, a reducer store, server-side data loading, deferred search and backdrop-based outside clicks. The cart button still floats right, as in the legacy design (問題2).
