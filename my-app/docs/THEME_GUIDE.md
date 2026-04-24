# Carno theme guide

**App:** Carno — *track what fuels you*  
**Voice:** Direct coach tone. UI uses a small warm palette only — no extra marketing colors in code.

## Design tokens (only these)

Defined in [`src/app/globals.css`](../src/app/globals.css) as `--carn-*` and exposed as Tailwind **`brandcolor-*`** via `@theme inline`.

| Token | Hex | Role |
|--------|-----|------|
| `brandcolor-fill` | `#F1EFE8` | Page / shell background (sidebar, mobile header strip) |
| `brandcolor-white` | `#FFFFFF` | Cards, assistant bubbles, inputs on fill, text on primary buttons |
| `brandcolor-primary` | `#D85A30` | Primary actions, links, accents, active nav |
| `brandcolor-primary-hover` | `#B84A26` | Hover on `bg-brandcolor-primary` |
| `brandcolor-text-strong` | `#3C1A0A` | Headings, body text, scrims (`/opacity`) |
| `brandcolor-text-weak` | `#6B4A3E` | Captions, helper text |
| `brandcolor-stroke-strong` | `#5C4034` | Focus rings, strong borders, default Phosphor stroke on chrome |
| `brandcolor-strokeweak` | `#D4C4BC` | Default borders, hover border on inputs |

**Rules:** Do not add new `--carn-*` or `brandcolor-*` entries without updating this file and [`themeguide.json`](../themeguide.json). Do not use raw hex or default Tailwind grays in components.

## Typography

- **Headings:** DM Serif Display (`font-serif`).
- **Body / UI:** DM Sans (`font-sans`, default on `body`).

Fonts load in [`src/app/layout.tsx`](../src/app/layout.tsx).

## Icons

**Phosphor** (`@phosphor-icons/react`), Regular weight. On the fill shell, inactive nav icons use **`text-brandcolor-stroke-strong`**; active state uses **`text-brandcolor-primary`**.

## Light UI only

The app does not swap the whole palette for `prefers-color-scheme: dark`.

## Brand assets (`public/brand/`)

| File | Use |
|------|-----|
| `carno-agent.png` | Assistant avatar; sidebar & mobile header logo (`CARNO_LOGO_AGENT`) |
| `carno-mark-cream.png` | Optional mark |
| `carno-mark-marrow-bg.png`, `carno-mark-flame-bone.png` | Optional / marketing |

Paths: [`src/lib/brand.ts`](../src/lib/brand.ts).

## App chrome (`AppShell`)

- **Desktop:** Collapsible sidebar on **`bg-brandcolor-fill`**, border **`brandcolor-strokeweak`**. Expand preference: `localStorage` key `carno-sidebar-expanded`. When **collapsed**, the top slot is **Phosphor `Sidebar`** (compact **8×8** control). When **expanded**, the top row is **left-aligned** **logo** (link to Chats): **`CARNO_LOGO_AGENT`** on **`bg-brandcolor-white`**, no border, **`object-contain`**, then **collapse** (`Sidebar` flipped, **8×8**, **20px** icon). **Plus** / “New chat” sits **above** the **Chats** nav row. Nav label **Chats** (today’s thread); **History** stays past days only.
- **Mobile:** Top bar on **`bg-brandcolor-fill`**; **menu** then **`CARNO_LOGO_AGENT`** **left-aligned** on **`bg-brandcolor-white`** (link to Chats), no border; drawer **`bg-brandcolor-white`**; backdrop **`bg-brandcolor-text-strong/40`**.

## Chat

- **Day badge:** Weekday (e.g. Monday) · Today · `YYYY-MM-DD` in a pill: **`bg-brandcolor-fill`**, **`border-brandcolor-strokeweak`**, small sans text — first row on new-day onboarding (above the greeting), and sticky atop the message list after the first log.
- **Meal quick-picks:** Raster art under `public/brand/meal-quick-*.png` (chicken, mutton, paneer, red meat, brown eggs); five shortcuts on **one horizontal row** (scroll on very narrow widths). Tiles default **`bg-brandcolor-white`** + weak stroke; **hover** **`bg-brandcolor-fill`**. Image + label same line; **`mix-blend-multiply`** on the art.
- **Start fresh today:** Server action [`src/app/actions/day-session.ts`](../src/app/actions/day-session.ts) clears messages, food entries (reactions cascade), and daily summary for **today’s** session when **`ACTIVE`** and **`CHAT`** only; then re-inserts the welcome line from **`DAY_CHAT_WELCOME_BODY`** in [`src/lib/session.ts`](../src/lib/session.ts).
- Assistant rows: avatar `CARNO_LOGO_AGENT` on **`bg-brandcolor-fill`**, no border on the avatar plate; bubble **`bg-brandcolor-white`** + weak border.
- User bubbles: **`bg-brandcolor-white text-brandcolor-text-strong`** (no border).
- Before the first USER message of the day: centered greeting (time-based + display name), meal field with **inline arrow send** (no “Send” label), and stroke-weak quick-picks; transcript hidden so the DB seed welcome stays out of view until then.
- Meal composer: one white pill; **`border-transparent`** → hover **`border-brandcolor-strokeweak`** → focus **`border-brandcolor-stroke-strong`**; primary circle with **PaperPlaneRight**; disabled at **50% opacity** when draft is empty; **Enter** submits (Shift+Enter newline).

## Agent animation

`@keyframes carno-speak` → **`animate-carno-speak`** on the assistant avatar while a server action is pending.

## Machine-readable spec

See [`themeguide.json`](../themeguide.json).
