# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A demo storefront (UI in Traditional Chinese, `lang="zh-TW"`, prices in NT$) being migrated from a single-file page (`legacy/index.html`) to **Next.js 16 + React 19 + TypeScript** (App Router, CSS Modules) in `src/`. `legacy/index.html` is the reference for visual design and copy: **do not change its styling, titles or text**. New UI elements (search box, dialogs, toast) use the same palette.

Workflow rules (from the user):
- Scaffold first, then generate tickets with Matt Pocock's `/to-tickets` skill, then implement.
- Tickets live in `docs/tickets/<feature>/NN-*.md` (never `.scratch/`).
- Changes are minimal and happen only through tickets.
- Every ticket ships with its own tests: `describe("Ticket NN: …")`, colocated as `*.test.ts(x)`.
- Each ticket is reviewed by the global `reviewer` agent (`~/.claude/agents/reviewer.md`), which scores the work against the rubric below.

## Grading rubric (all work is judged on this)

**1. Code Structure (60%)**
- Use a framework (React via Next.js here) rather than raw DOM manipulation.
- Proper component separation and design.
- Modern frontend features (hooks).
- Clear, readable code structure.
- State management (3 points): `CartProvider` context + `useReducer`.
- Custom hooks where logic is reusable (e.g. `useCart`); extract more where it clarifies.
- CSS organization: CSS Modules per component, flat selectors, legacy values only.

**2. Problem Solving & Optimization (30%)**
- CSS/layout: fix incorrect or incomplete styles without changing the legacy look.
- JS/logic: complete implementations, efficient rendering, correct data handling, readable structure.

## Commands

```bash
npm run dev            # dev server on :3000 (also `next-dev` in .claude/launch.json)
npm run build          # production build (also type-checks)
npm run lint           # eslint (flat config, eslint-config-next core-web-vitals + typescript)
npm run typecheck      # tsc --noEmit
npm test               # vitest run
npx vitest run src/lib/cart.test.ts -t "clamps"   # single test file / test name
```

Tests run in jsdom (`vitest.config.mts`). `src/test/setup.ts` loads jest-dom matchers and polyfills `<dialog>` `showModal`/`close`. `renderWithCart()` in `src/test/render.tsx` wraps UI in a `CartProvider` with the real catalog. `server-only` is stubbed for tests. Components that import `@/app/actions` need `vi.mock("@/app/actions", ...)`.

## Architecture

- **Data flow:** `src/app/page.tsx` is a Server Component that awaits `getProducts()` (`src/lib/catalog.ts`, `server-only`, simulated latency over `src/data/products.ts`) and passes the products to the client tree `components/layout/Shop.tsx`. Pending and failure states come from `app/loading.tsx` and `app/error.tsx`. The page is currently prerendered statically at build time.
- **Cart state:** `components/cart/CartProvider.tsx` (React context + `useReducer`) is the only client store. It also owns drawer open/close and the toast. Read it with `useCart()`.
- **Pure cart logic** lives in `src/lib/cart.ts` and is unit-tested. The cart stores only `{ [productId]: quantity }`. Product data and prices are always resolved from the catalog (`toCartLines`), so stale or tampered localStorage can't change prices. Quantities are clamped to `MAX_QUANTITY` (99), and `parseCart` validates persisted data.
- **Persistence:** the cart is saved to localStorage under `vibecode-shop:cart`. The reducer starts from the frozen `UNLOADED` sentinel and the persist effect skips it. Keep that pattern: it stops the first empty render (and StrictMode's double effects) from overwriting a saved cart.
- **Checkout** is a Server Action (`src/app/actions.ts`). It re-validates ids and quantities and re-prices every line on the server. The client calls it inside `useTransition` for the pending state.
- **Confirmations** go through the reusable `ConfirmDialog` (native `<dialog>` + `showModal()`). Removing an item, including pressing `−` at quantity 1 or typing 0, and checkout both go through it.
- **Cart drawer:** outside-click closing uses a backdrop element, never a document listener that inspects `e.target`. The legacy page's document listener closed the sidebar on every `+`/`−` click, because the `innerHTML` re-render had already detached the click target.
- **Lint rules to know:** the React Compiler lint rules (`react-hooks/set-state-in-effect`, `react-hooks/purity`) are on. No `setState` directly in effect bodies and no `Date.now()` during render.

## Layout of `src/components/`

Grouped by feature: `cart/` (provider, drawer, checkout), `catalog/` (grid, search, product card), `layout/` (header, shop shell), `ui/` (generic `ConfirmDialog`, `Toast`). Import across folders with `@/components/<group>/<Name>`. CSS Modules and tests sit next to their component.
