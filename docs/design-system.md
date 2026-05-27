# Design System - Sunflour Bakery

Status: Phase 0 frontend lockdown document. This file converts `frontend-implimentation.md` into implementation rules for tokens, components, accessibility, performance, and visual behavior.

## Source Of Truth

Read these files before editing frontend UI:

```txt
AGENTS.md
frontend-implimentation.md
backend-implementation.md
docs/frontend-routes.md
docs/component-contracts.md
docs/api-contracts.md
```

`AGENTS.md` is the repository-level source of truth. `frontend-implimentation.md` is the detailed frontend source for this document. If token names or color values conflict, stop and reconcile the decision before writing CSS.

## Mental Model

The frontend system is built in layers:

```txt
design tokens -> primitives -> composed components -> route sections -> routes -> flows
```

This exists so the product can ship quickly without visual drift. A route should not invent styling. A business component should not invent primitive behavior. A primitive should not know checkout or admin business rules.

## Knowledge Levels

Must know by heart:

- Mobile-first is non-negotiable.
- WCAG 2.2 AA is the accessibility target.
- The frontend never owns trusted money calculations.
- Use semantic tokens, not random colors.
- One primary action per screen.
- Checkout must show subtotal, delivery fee, 6 PM surcharge when applied, and total before order creation.
- Payment is manual and must remain visibly pending until backend/admin confirmation.
- Admin UI is operational, not decorative.

Must recognize:

- Apple HIG gives clarity, hierarchy, restraint, familiar interaction, and respect for system preferences.
- Material Design 3 gives semantic color roles, component state consistency, surfaces, and predictable navigation.
- GOV.UK gives form validation quality, error summaries, field-level errors, and plain language.
- Shopify Polaris gives admin operation patterns: filters, status badges, row actions, confirmation for destructive work.
- Stripe Checkout gives payment clarity, short checkout, visible costs, and confidence without noise.
- Vercel Commerce gives server-rendered storefront speed, App Router structure, and small public bundles.
- Core Web Vitals give measurable performance targets: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1.

Lookup-only:

- Exact framework API syntax.
- Current Vercel and Next.js deployment behavior.
- Detailed WCAG success criteria references.
- Vendor component examples from Apple, Material, Shopify, Stripe, and GOV.UK.

## Industry Standard Mapping

| Standard | Sunflour application |
| --- | --- |
| Apple HIG | Clear hierarchy, one obvious action, restrained screens, comfortable tap targets, designed dark mode. |
| Material Design 3 | Semantic color roles, consistent hover/focus/pressed/disabled/loading states, controlled surfaces. |
| WCAG 2.2 AA | Contrast, keyboard access, labels, focus states, non-color status meaning, reduced motion. |
| GOV.UK Design System | Plain error copy, form error summary, field-level guidance, predictable checkout forms. |
| Shopify Polaris | Admin lists with filters, search, status badges, clear row actions, guarded destructive actions. |
| Stripe Checkout | Short checkout, fee visibility, unmistakable payment instruction, pending payment honesty. |
| Vercel Commerce | Server-first storefront, optimized images, Suspense/loading states, small client JavaScript. |
| Core Web Vitals | Image stability, low layout shift, no heavy public-page scripts, measurable speed. |

## UI Principles

Non-negotiables:

- Mobile-first, not mobile-afterthought.
- Predictability before creativity.
- Speed before decoration.
- Accessibility before visual tricks.
- Reusable components before one-off layouts.
- One primary action per screen.
- Clear pricing before checkout.
- No hidden delivery logic.
- Manual payment must feel structured.
- Admin UI must feel operational, not decorative.

Sunflour should feel:

```txt
Warm.
Fresh.
Clean.
Family-friendly.
Professional.
Affordable but not cheap.
Modern but not cold.
Food-first, not tech-first.
```

Reject:

- Crowded product cards.
- Too many colors fighting the logo.
- Random gradients.
- Oversized shadows.
- Multiple CTAs with equal weight.
- Tiny mobile text.
- Hidden delivery fees.
- Checkout walls of text.
- Admin dashboards filled with vanity charts.
- Dark mode that looks like inverted light mode.

## Token Policy

Components consume semantic roles like `bg-surface`, `text-primary`, `border-default`, and state tokens. Components must not spread raw brand colors across JSX.

The frontend implementation plan defines semantic tokens. `AGENTS.md` defines core project colors. Implementation should expose the semantic tokens below and may alias AGENTS core names to these values if needed.

## Brand Foundation

```txt
Logo red:       #F00000
Deep red:       #B91C1C
Warm yellow:    #FFD400
Golden yellow:  #F4C400
Ink black:      #111111
Warm cream:     #FFF8EA
Soft wheat:     #FFF1C9
Fresh white:    #FFFFFF
```

## Light Mode Tokens

Place these in `src/styles/tokens.css` when the app foundation exists.

```css
:root {
  --color-bg: #fff8ea;
  --color-bg-subtle: #fff1c9;
  --color-surface: #ffffff;
  --color-surface-soft: #fffaf0;
  --color-surface-elevated: #ffffff;

  --color-text: #21140a;
  --color-text-muted: #6f5842;
  --color-text-soft: #8a735b;
  --color-text-inverse: #ffffff;

  --color-primary: #e60000;
  --color-primary-hover: #c91414;
  --color-primary-pressed: #a80f0f;
  --color-on-primary: #ffffff;

  --color-accent: #ffd400;
  --color-accent-soft: #fff3b0;
  --color-on-accent: #21140a;

  --color-border: #eadcc5;
  --color-border-strong: #d8c2a2;
  --color-focus: #0b6fff;

  --color-success: #128c4a;
  --color-success-soft: #e7f7ee;
  --color-warning: #b7791f;
  --color-warning-soft: #fff4d6;
  --color-danger: #c81e1e;
  --color-danger-soft: #ffe8e8;

  --shadow-soft: 0 8px 24px rgba(33, 20, 10, 0.08);
  --shadow-card: 0 12px 32px rgba(33, 20, 10, 0.10);
  --shadow-modal: 0 24px 80px rgba(33, 20, 10, 0.22);
}
```

## Dark Mode Tokens

Dark mode is designed, not inverted. Public pages can follow system preference. Admin may add a manual theme toggle if it stays simple.

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0f0a06;
    --color-bg-subtle: #17100a;
    --color-surface: #1c130c;
    --color-surface-soft: #24180f;
    --color-surface-elevated: #2b1d12;

    --color-text: #fff8ed;
    --color-text-muted: #d8c5a8;
    --color-text-soft: #bca98d;
    --color-text-inverse: #21140a;

    --color-primary: #ff4d42;
    --color-primary-hover: #ff675f;
    --color-primary-pressed: #e23832;
    --color-on-primary: #1b0806;

    --color-accent: #ffd84d;
    --color-accent-soft: #4a3906;
    --color-on-accent: #21140a;

    --color-border: #3b2a1c;
    --color-border-strong: #58402b;
    --color-focus: #77a7ff;

    --color-success: #4ade80;
    --color-success-soft: #15351f;
    --color-warning: #facc15;
    --color-warning-soft: #3f3108;
    --color-danger: #ff6b6b;
    --color-danger-soft: #431515;

    --shadow-soft: 0 8px 24px rgba(0, 0, 0, 0.30);
    --shadow-card: 0 12px 32px rgba(0, 0, 0, 0.36);
    --shadow-modal: 0 24px 80px rgba(0, 0, 0, 0.60);
  }
}
```

## Typography

Use `Inter`, `Manrope`, or a similar clean UI font. Do not use decorative fonts for app UI, and do not recreate or distort the logo.

```css
--font-sans: Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.25rem;

--leading-tight: 1.15;
--leading-normal: 1.5;
--leading-relaxed: 1.65;
```

Rules:

- Use readable body text on mobile.
- Keep admin headings compact and scannable.
- Do not use viewport-width font scaling.
- Keep letter spacing at `0` unless a specific label needs uppercase tracking.

## Radius, Spacing, Elevation

```css
--radius-xs: 6px;
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 18px;
--radius-xl: 24px;
--radius-2xl: 32px;
--radius-pill: 999px;

--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

Use cards only for real grouping: product items, repeated admin metrics, dialogs, and framed tool surfaces. Do not turn whole page sections into floating cards.

## Motion

```css
--motion-fast: 120ms;
--motion-normal: 180ms;
--motion-slow: 260ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

Use motion for feedback, modal/sheet entry, page transitions, and cart updates. Respect `prefers-reduced-motion`. Never animate checkout totals in a way that delays reading or creates uncertainty.

## Component State Standard

Every interactive component must define:

- Default.
- Hover where pointer exists.
- Focus-visible.
- Pressed/active where relevant.
- Disabled.
- Loading where async behavior exists.
- Error where user correction is possible.

Focus rings must be visible in light and dark mode. Buttons and controls should meet comfortable mobile touch size; target 44px minimum height for primary touch actions.

## Form And Error Standard

Checkout and admin forms follow the GOV.UK pattern:

- Validate with Zod through the form layer and backend.
- Show field-level error messages close to the field.
- Show an error summary at the top of serious checkout/admin forms.
- Use direct language: `Enter your phone number`, `Choose your delivery location`, `This item is currently out of stock`.
- Do not rely only on browser-native validation.
- Do not hide submit errors inside toasts only.

## Commerce UI Rules

- Product browsing is fast and readable.
- Product cards are not crowded.
- Out-of-stock items cannot be ordered.
- Cart totals are display-only until backend checkout confirmation.
- Delivery base fee and 6 PM surcharge must be visually separate.
- Checkout can be completed without email.
- Payment instruction shows order number, amount, account details, invoice link, and WhatsApp proof action.
- UI never says payment is confirmed until backend/admin confirmation.

## Admin UI Rules

- Admin screens are dense enough for operations but not crowded.
- Dashboard prioritizes current work: pending payment, preparing orders, delivery, reviews, unavailable products.
- Lists need filters, search, status badges, and row actions.
- Destructive or irreversible actions require confirmation.
- Moderator sees restricted states for sensitive settings.
- Super admin changes should show audit-context copy.

## Accessibility Checklist

- [ ] Target WCAG 2.2 AA.
- [ ] Text contrast passes in light mode.
- [ ] Text contrast passes in dark mode.
- [ ] Every input has visible or accessible label.
- [ ] Every field error explains what to fix.
- [ ] Checkout has an error summary for serious validation failures.
- [ ] Focus state is visible on every interactive element.
- [ ] Dialogs and sheets trap focus.
- [ ] `Esc` closes dismissible dialogs.
- [ ] Buttons have accessible names.
- [ ] Decorative icons are hidden from assistive tech.
- [ ] Meaningful icons have accessible names.
- [ ] Product images have useful alt text.
- [ ] Status is not communicated by color alone.
- [ ] Reduced motion is respected.
- [ ] Admin tables are keyboard usable.

## Performance Checklist

- [ ] LCP target is <= 2.5s.
- [ ] INP target is <= 200ms.
- [ ] CLS target is <= 0.1.
- [ ] Use `next/image` for product and hero images.
- [ ] Set image width/height or stable aspect ratio.
- [ ] Use responsive image sizes.
- [ ] Prioritize only true above-the-fold hero imagery.
- [ ] Lazy-load below-fold product images.
- [ ] Avoid heavy animation libraries unless needed.
- [ ] Keep public pages mostly server-rendered.
- [ ] Use `loading.tsx` and skeletons for route segments.
- [ ] Split admin-heavy components away from public bundles.
- [ ] Do not load admin chart/table dependencies on public routes.

## Design Review Checklist

- [ ] The screen has one primary action.
- [ ] The user can answer: where am I, what can I do, what happens next?
- [ ] Mobile 360px layout is usable.
- [ ] Text does not overflow containers.
- [ ] Touch targets are comfortable.
- [ ] Loading, empty, error, disabled, and success states exist where relevant.
- [ ] Light and dark mode both look intentional.
- [ ] No business-trusted total is calculated only in the frontend.
- [ ] No random colors or one-off component styling.
- [ ] No admin-sensitive settings are exposed to unauthorized roles.

## Reference Links

```txt
Apple HIG: https://developer.apple.com/design/human-interface-guidelines
Material Design 3: https://m3.material.io/
WCAG 2.2: https://www.w3.org/TR/WCAG22/
GOV.UK Design System: https://design-system.service.gov.uk/
Shopify Polaris: https://polaris-react.shopify.com/
Stripe Checkout: https://stripe.com/payments/checkout
Vercel Commerce: https://vercel.com/templates/next.js/nextjs-commerce
Core Web Vitals: https://web.dev/articles/vitals
```
