# Sunflour Bakery — Design System

A working design system for **Sunflour Bakery**, a mobile-first bakery & food
ordering platform. Customers browse a menu (cakes, burgers, shawarma, pizza,
ice cream, pastries, chops), build a cart, choose pickup or delivery, and pay by
**Moniepoint bank transfer** with WhatsApp proof — payment stays visibly
*pending* until staff manually confirm it. There is also an **operational admin**
surface for orders, products, delivery, reviews, and settings.

Prices are in **Nigerian Naira (₦)**, stored as kobo and formatted `en-NG`.
The product is built Next.js + React + Tailwind v4, icons from **lucide-react**.

> **Brand feeling (verbatim from the source design doc):**
> Warm. Fresh. Clean. Family-friendly. Professional. Affordable but not cheap.
> Modern but not cold. **Food-first, not tech-first.**

---

## Sources

This system was reverse-engineered from materials the user provided. The reader
may not have access, but they are recorded here so they can dig deeper:

- **Codebase:** `SUNFLOUR/` — Next.js 16 / React 19 / Tailwind v4 app.
  The richest source of truth. Key reading:
  - `SUNFLOUR/docs/design-system.md` — the canonical token + principles doc.
  - `SUNFLOUR/src/components/ui/*` — primitives (Button, Card, Badge, Input…).
  - `SUNFLOUR/src/components/commerce/*` — product cards, cart, menu browser.
  - `SUNFLOUR/src/components/layout/*` — public shell, admin shell, footer.
  - `SUNFLOUR/src/lib/{formatters,status}.ts` — Naira formatting, status meta.
- **Uploaded token sheet:** `uploads/globals.css` — the live CSS variables.
- **GitHub repo:** <https://github.com/Kingsley-A1/sunflour> — the repo the
  user attached. (At the inspected ref it only exposed `.env.example`; the
  mounted `SUNFLOUR/` codebase is the full source. Explore the repo further to
  build with higher fidelity if it grows.)
- **Brand assets:** `SUNFLOUR/logo.png` (wheat-and-sun script logo) and
  `SUNFLOUR/menu.jpg` (the full product menu board). Both copied to `assets/`.

---

## Index / Manifest

Root files:

| File | What it is |
| --- | --- |
| `README.md` | This document. Brand, content, visual foundations, iconography. |
| `colors_and_type.css` | All design tokens — color, type, spacing, radius, motion — as CSS vars, plus semantic type classes (`.sf-hero`, `.sf-h1`, `.sf-eyebrow`, `.sf-body`…). Import this in any artifact. |
| `SKILL.md` | Agent-Skills manifest so this folder works as a Claude skill. |
| `assets/` | `logo.png`, `menu.jpg`, and product photography. Copy these into designs — never redraw the logo. |
| `preview/` | Small HTML specimen cards that populate the Design System tab. |
| `ui_kits/storefront/` | UI kit for the **customer storefront** (home, menu, product, cart, checkout). |
| `ui_kits/admin/` | UI kit for the **operational admin** console (dashboard, orders, products). |

Each UI kit has its own `README.md`, an `index.html` interactive demo, and
small JSX components.

---

## CONTENT FUNDAMENTALS

How Sunflour writes. The voice is **plain, calm, and operationally honest** —
it never oversells, never hypes, never tricks. Clarity beats cleverness.

**Person & address.** Speaks to the customer as **"you"**; refers to the
business as **"Sunflour"** (third person, by name) rather than "we". Example:
*"Sunflour confirms payment manually before preparing or releasing the order."*

**Tone.** Reassuring and matter-of-fact. Copy explains *what happens next* and
*why*, especially around money. The menu footer line captures the warmer,
food-first side: **"Made with passion. Served with delight."** App/UI copy is
more restrained than the menu board.

**Casing.** Sentence case everywhere — headings, buttons, labels. **No
ALL-CAPS** except a small uppercase **eyebrow/kicker** with letter-spacing
(`WELCOME TO SUNFLOUR`, `ABOUT SUNFLOUR`). Buttons read like actions:
*"View menu"*, *"Review cart"*, *"View invoice"*, *"Add to cart"*.

**Plain, GOV.UK-style errors.** Direct, tells the user exactly what to fix:
*"Enter your phone number."* *"Choose your delivery location."* *"This item is
currently out of stock."* Never hide submit errors in a toast only; serious
checkout/admin forms get an error summary at the top.

**Payment honesty (a core content rule).** The UI **never says payment is
confirmed** until staff verify it. Statuses are explicit and human:
*"Pending payment"*, *"Payment under review"*, *"Payment confirmed"*,
*"Proof sent"*. Every status pill carries a helper sentence, e.g.
*"Waiting for transfer proof or admin review."*

**Marketing copy** stays concrete and benefit-led, no fluff:
*"Fresh bakery orders with clear checkout and invoice access."*
*"Base fee and 6 PM surcharge are shown separately."*
*"A bakery ordering experience built for clarity and trust."*

**Emoji:** none in product UI. The printed **menu board** uses a single red ❤
in its tagline — that is the only decorative glyph, and it is not used in the app.

**Numbers & money.** Always Naira with the ₦ symbol, no decimals
(`₦5,500`, `₦12,000`). Fees are itemised and never hidden: subtotal, delivery
base fee, the **6 PM surcharge** (shown as a separate line only when it applies),
then total.

---

## VISUAL FOUNDATIONS

**The mood in one line:** a warm cream bakery counter — soft, edible, calm — with
**one decisive red action** per screen and a flash of sunny yellow used like a
garnish, never a sauce.

### Color
- **Background is always warm cream `#FFF8EA`.** This is the brand's signature —
  pages are never flat white. Soft wheat `#FFF1C9` bands alternate sections.
  Cards/sheets sit on pure white `#FFFFFF` to lift off the cream.
- **Red `#E60000` is the single primary action color.** One primary action per
  screen. Hover darkens (`#C91414`), pressed darkens more (`#A80F0F`). The
  brighter logo red `#F00000` is reserved for the logo itself.
- **Yellow `#FFD400` is an accent, used sparingly** — small highlights, the
  text-selection background, popular tags. Never large yellow fills. The doc
  explicitly rejects "too many colors fighting the logo."
- **Text is warm near-black `#21140A`**, with muted `#6F5842` and soft `#8A735B`
  for secondary/caption. No pure `#000`.
- **The only cool color is the focus ring** (`#0B6FFF`) — deliberately the one
  non-warm hue, so keyboard focus is unmistakable.
- **Status colors** are conventional and calm: success green, warning amber,
  danger red, info blue — each with a soft tinted background for badges.

### Type
- **Inter** (fallback Manrope / system). One family does everything — no
  decorative display face. **Headings lean heavy: 800 (extrabold), even 900.**
  Body is 400–500. UI default size is 14px; body 16px; never below 12px.
- Tight leading on headings (1.15), relaxed on body (1.5–1.65). Letter-spacing
  is `0` everywhere except the uppercase eyebrow. **No viewport-width scaling.**
- Prices use **tabular figures** so stacked totals align.

### Backgrounds & imagery
- **Photographic, food-first.** Heroes are full-bleed appetizing food photos
  (the menu board, product spreads) under a **top-to-bottom black gradient**
  (`from-black/65 via-black/35 to cream`) so white headline text stays legible
  and the image melts into the cream page below.
- No abstract gradients, no purple/blue tech gradients, no patterns or textures
  as page fill. The cream itself is the texture.
- Product images sit in a **4:3 well** on `surface-soft`, `object-cover`, with a
  tiny `scale(1.02)` zoom on hover.

### Cards & elevation
- Cards = `radius-md` (14px) + 1px warm border `#EADCC5` + **soft warm-tinted
  shadow** (`0 8px 24px rgb(33 20 10 / 0.08)`). Shadows are gentle and never
  harsh; the doc explicitly rejects "oversized shadows."
- Cards are used only for **real grouping** (product items, metrics, dialogs) —
  whole page sections are *not* wrapped in floating cards.
- Three-step elevation: `--shadow-soft` (cards) → `--shadow-card` (sticky bars,
  raised) → `--shadow-modal` (dialogs/sheets).

### Radius
- Buttons & inputs: `radius-sm` (10px). Cards: `radius-md` (14px). Larger
  surfaces step up to 18/24/32px. Badges & status pills: full pill (999px).
  Nothing is sharp-cornered; nothing is fully circular except icon buttons/pills.

### Borders
- Hairline warm borders (`#EADCC5`, stronger `#D8C2A2`) separate surfaces and
  outline secondary/ghost buttons and inputs. Borders do the quiet structural
  work so shadows can stay soft.

### Motion
- **Fast and functional**, never showy. `120ms / 180ms / 260ms` with a single
  standard ease `cubic-bezier(0.2, 0, 0, 1)`. Used for feedback, modal/sheet
  entry, page and cart updates. **Never animate checkout totals** in a way that
  delays reading. Always respects `prefers-reduced-motion`.

### Interaction states
- **Hover:** primary button darkens; secondary/ghost get a `surface-soft` wash;
  links underline; product image nudges to `scale(1.02)`.
- **Pressed/active:** primary goes a shade darker still (`pressed` token). No
  bounce, no large scale.
- **Focus-visible:** 3px solid blue ring, 2–3px offset — visible in light & dark.
- **Disabled:** ~55% opacity, `not-allowed` cursor.
- **Loading:** spinner (`LoaderCircle`) inside the control; async controls show it.
- Every interactive component must define default / hover / focus / pressed /
  disabled / loading / error.

### Touch & layout rules
- **Mobile-first is non-negotiable.** 360px must be fully usable. Primary touch
  targets are **≥ 44px** tall (buttons are min-h 40/44/48 by size).
- One primary action per screen. Sticky **cart bar pinned to the bottom on
  mobile**; sticky translucent **header with backdrop-blur** on top.
- Content sits in centered max-width columns (`max-w-6xl` public, `max-w-7xl`
  admin) with comfortable `16px` gutters.

### Transparency & blur
- Used sparingly and purposefully: the **sticky header** is `bg/92` + backdrop
  blur; the **mobile cart bar** is `surface/95` + blur; hero overlays use
  semi-transparent black gradients. No frosted glass as decoration elsewhere.

### Dark mode
- **Designed, not inverted.** Warm dark browns (`#0F0A06` bg, `#1C130C`
  surface), warmer light text, brightened primary `#FF4D42`. The doc rejects
  "dark mode that looks like inverted light mode."

### What to avoid (from the source doc)
Crowded product cards · too many colors fighting the logo · random gradients ·
oversized shadows · multiple equal-weight CTAs · tiny mobile text · hidden
delivery fees · checkout walls of text · vanity admin charts.

---

## ICONOGRAPHY

- **Library: [lucide-react](https://lucide.dev)** — the app depends on
  `lucide-react`. Lucide is a clean, **outline / stroke** icon set
  (~1.5–2px stroke, rounded joins). This is the only icon system in the product.
- **Usage:** icons are small and supportive (`h-4 w-4` / `h-5 w-5`), tinted
  `currentColor` or `--color-primary` for emphasis. Decorative icons are
  `aria-hidden`; meaningful icons get accessible names. Icons pair with text
  labels — they rarely stand alone.
- **Icons seen in the codebase:** `ShoppingBag`, `UserRound`, `ArrowRight`,
  `Clock`, `Truck`, `ReceiptText`, `ShieldCheck`, `HandCoins`, `FileText`,
  `Minus`, `Plus`, `Trash2`, `LoaderCircle`, and the admin nav set
  `LayoutDashboard`, `ClipboardList`, `Package`, `Settings`, `Mail`,
  `MessageSquareText`, `ShieldCheck`.
- **For HTML artifacts:** load Lucide from CDN —
  `<script src="https://unpkg.com/lucide@latest"></script>` then
  `lucide.createIcons()`, using `<i data-lucide="shopping-bag"></i>`. The UI
  kits in this system use exactly this approach (no hand-drawn SVG icons).
- **No emoji** in product UI. **No Unicode glyphs** used as icons. The only
  ornamental mark anywhere is the single red ❤ on the printed menu board, which
  does not appear in the app.
- **Logo:** `assets/logo.png` — a red brush-script "Sunflour" with two black
  wheat stalks rising through a yellow sun-ray arc. **Never recreate, recolor,
  or distort it** (explicit doc rule). In the app it appears at 44×44 in the
  header, `object-contain`, on cream/white.

---

## CONTENT FUNDAMENTALS — quick reference card

| Aspect | Rule |
| --- | --- |
| Person | "you" (customer) · "Sunflour" (business, by name) |
| Case | Sentence case; uppercase only on tracked eyebrow |
| Buttons | Verb-led: "View menu", "Add to cart", "View invoice" |
| Errors | Plain, prescriptive: "Enter your phone number." |
| Money | Naira ₦, no decimals, fees itemised, 6 PM surcharge separate |
| Payment | Never "confirmed" until staff verify — pending is honest |
| Emoji | None in UI |
