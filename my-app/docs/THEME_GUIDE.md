# Carno theme guide

**App:** Carno — *track what fuels you*  
**Voice:** Direct, knowledgeable coach. Meat-first recovery framing; no “plant-based” cool greens/blues in the palette.

## Core swatches (Carnivore Warmth)

| Name         | Hex       | Role                                      |
|-------------|-----------|-------------------------------------------|
| Deep Marrow | `#3C1A0A` | Brand chrome, headings, strong text       |
| Sear        | `#D85A30` | Primary actions, links, accents           |
| Bone        | `#F5C4B3` | Soft fills, assistant bubbles, panels     |
| Tallow      | `#F0997B` | Secondary accent, muted emphasis          |
| Salt        | `#F1EFE8` | Page background (`brandcolor-fill`)       |

## Typography

- **Headings:** DM Serif Display (`font-serif`) — editorial, “signage” feel.
- **Body / UI:** DM Sans (`font-sans`, default on `body`).

Loaded in [`src/app/layout.tsx`](../src/app/layout.tsx); font CSS variables are wired in [`src/app/globals.css`](../src/app/globals.css) `@theme inline`.

## Icons

- **Phosphor** (`@phosphor-icons/react`), Regular weight.
- Default accent on icons in chrome: **Sear** — `text-brandcolor-primary` on the Deep Marrow nav bar.

## Light UI on phones

The app uses the **Salt / cream palette only**. We intentionally **do not** switch the whole UI when the phone’s system theme is dark (`prefers-color-scheme: dark`), so Carno always matches the intended warm light look on mobile and desktop.

## Tailwind tokens

All app colors are **`brandcolor-*`** utilities from `@theme` in [`src/app/globals.css`](../src/app/globals.css). There is no `tailwind.config.js` in this project.

**Do not** use raw hex, `bg-gray-*`, `text-zinc-*`, teal/sky/emerald, etc. in components — use the tokens documented in [`themeguide.json`](../themeguide.json).

## Top nav

Uses fixed **Deep Marrow** (`brandcolor-nav-chrome`) so it stays on-brand in light and dark system themes. Foreground: `brandcolor-nav-chrome-fg`.

## Machine-readable spec

See [`themeguide.json`](../themeguide.json) for per-token usage, example classes, and AI workflow steps (read `globals.css` first).
