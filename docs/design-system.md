# Design System - Sunflour Bakery

Status: phases `1-8` production contract. Framework-neutral foundation package: `@sunflour/design-tokens` v0.1.0.

## Source Architecture

The design system has one-way ownership:

```txt
packages/design-tokens/tokens.css
  -> packages/design-tokens/themes.css
  -> packages/design-tokens/motion.css
  -> src/styles/component-contracts.css
  -> route and component usage
```

- `tokens.css` owns raw palette, dimensions, type values, layout values, and motion values.
- `themes.css` maps primitives to semantic light/dark roles and owns temporary compatibility aliases.
- `motion.css` owns reusable behavior and reduced-motion safeguards.
- `component-contracts.css` is application-specific: global element defaults, layout utilities, and typography roles.
- `globals.css` is an import manifest only.

Components must not consume primitive tokens or deprecated aliases. The automated design-system contract test enforces this boundary.

### Versioning

Use semantic versioning for `@sunflour/design-tokens`:

- Patch: value refinement that preserves meaning and consumer APIs.
- Minor: additive token or motion contract.
- Major: token removal, rename, or semantic meaning change.

Compatibility aliases remain available for older consumers in v0.1.0, but current Sunflour route and component code uses canonical semantic names.

## Source Of Truth

Read these files before changing frontend UI:

```txt
AGENTS.md
frontend-implimentation.md
backend-implementation.md
docs/component-contracts.md
docs/frontend-routes.md
packages/design-tokens/*.css
src/styles/component-contracts.css
src/app/globals.css
```

`AGENTS.md` is the product authority. The internal package is the implementation authority for framework-neutral tokens and motion; `component-contracts.css` owns application-specific contracts.

## Mental Model

The frontend system is built in this order:

```txt
primitive palette -> semantic roles -> primitives -> business components -> routes -> flows
```

Do not skip layers. New UI work should consume semantic roles, not raw brand values.

## Non-Negotiables

- Mobile-first.
- WCAG 2.2 AA.
- Light mode excellent, system dark mode comfortable.
- Predictable hierarchy before decoration.
- One authoritative Sunflour palette.
- Motion supports comprehension and feedback; it never blocks interaction.
- Existing legacy token consumers stay working until a later migration phase.

## 1. Primitive Palette

These are the only authoritative base colors for the app foundation.

| Primitive | Light | Dark |
| --- | --- | --- |
| `--primitive-brand-red` | `#B22416` | `#FF6B5A` |
| `--primitive-brand-red-strong` | `#8F1C12` | `#FF8A7B` |
| `--primitive-brand-yellow` | `#FFD400` | `#FFD84D` |
| `--primitive-brand-yellow-soft` | `#FFF3B0` | `#3A2F10` |
| `--primitive-cream` | `#FFF8EC` | `#18120C` |
| `--primitive-surface` | `#FFFFFF` | `#211812` |
| `--primitive-surface-muted` | `#F8F3EA` | `#2C2119` |
| `--primitive-ink` | `#24150D` | `#FFF7ED` |
| `--primitive-ink-muted` | `#6F4B33` | `#D8C3AE` |
| `--primitive-border` | `#E9DCC8` | `#49362B` |
| `--primitive-success` | `#128C4A` | `#4ADE80` |
| `--primitive-warning` | `#B7791F` | `#FACC15` |
| `--primitive-danger` | `#B42318` | `#FB7185` |
| `--primitive-info` | `#2563EB` | `#93C5FD` |

Rejected from the foundation:

- `#F00000`
- `#B91C1C`
- `#DC0000`
- `#F4C400`

Those values created competing reds/yellows and are no longer part of the reusable contract.

## 2. Semantic Color Roles

Semantic tokens are the only colors components should depend on.

### Canvas and surfaces

- `--color-canvas`
- `--color-canvas-muted`
- `--color-canvas-emphasis`
- `--color-surface`
- `--color-surface-muted`
- `--color-surface-raised`
- `--color-surface-floating`
- `--color-surface-overlay`

Use:

- `canvas` for page background.
- `canvas-emphasis` for restrained background warmth.
- `surface` for standard panels.
- `surface-raised` for cards and grouped items.
- `surface-floating` for sheets, dialogs, sticky overlays, and toast surfaces.

### Text and borders

- `--color-text`
- `--color-text-muted`
- `--color-text-soft`
- `--color-text-inverse`
- `--color-border`
- `--color-border-strong`
- `--color-border-focus`

### Actions and feedback

- `--color-primary`
- `--color-primary-hover`
- `--color-primary-pressed`
- `--color-on-primary`
- `--color-accent`
- `--color-accent-soft`
- `--color-on-accent`
- `--color-success`
- `--color-success-soft`
- `--color-warning`
- `--color-warning-soft`
- `--color-danger`
- `--color-danger-soft`
- `--color-info`
- `--color-info-soft`

### Focus, overlays, disabled

- `--color-focus`
- `--color-overlay`
- `--color-overlay-strong`
- `--color-disabled-bg`
- `--color-disabled-border`
- `--color-disabled-text`

Rules:

- Focus must remain visible in light and dark mode.
- Status must never rely on color alone.
- Disabled states must lower affordance without reducing text contrast into ambiguity.

## 3. Compatibility Aliases

These legacy names remain active so existing components keep working during phases `1-6`:

| Legacy token | Canonical source |
| --- | --- |
| `--color-bg` | `--color-canvas` |
| `--color-bg-subtle` | `--color-canvas-muted` |
| `--color-surface-soft` | `--color-surface-muted` |
| `--color-surface-elevated` | `--color-surface-raised` |
| `--color-brand-red` | `--color-primary` |
| `--color-brand-red-strong` | `--primitive-brand-red-strong` |
| `--color-brand-yellow` | `--color-accent` |
| `--color-brand-yellow-soft` | `--color-accent-soft` |
| `--color-cream` | `--color-canvas` |
| `--shadow-soft` | `--shadow-raised` |
| `--shadow-card` | `--shadow-floating` |
| `--motion-fast` | `--motion-duration-fast` |
| `--motion-normal` | `--motion-duration-base` |
| `--motion-slow` | `--motion-duration-slow` |
| `--ease-standard` | `--motion-ease-standard` |

No new component work should introduce fresh aliases.

## 4. Depth And Elevation

Use these elevation tokens:

- `--shadow-raised`
- `--shadow-floating`
- `--shadow-modal`

Elevation levels:

- Raised: cards and repeated grouped surfaces.
- Floating: toast, sticky utility elements, and elevated panels.
- Modal: dialogs and major overlays only.

Rules:

- Use tonal separation before stronger shadows.
- Do not stack multiple dramatic shadows.
- Do not use gradients as a replacement for hierarchy.

## 5. Layout Contract

### Tokens

- `--layout-container-public`
- `--layout-container-admin`
- `--layout-page-gutter`
- `--layout-section-space-sm`
- `--layout-section-space-md`
- `--layout-section-space-lg`
- `--control-height-sm`
- `--control-height-md`
- `--control-height-lg`
- `--layer-base`
- `--layer-header`
- `--layer-overlay`
- `--layer-modal`
- `--layer-toast`
- `--layer-loading`

### Reusable utilities

- `.sf-container-public`
- `.sf-container-admin`
- `.sf-section-sm`
- `.sf-section` / `.sf-section-md`
- `.sf-section-lg`
- `.sf-control-sm`
- `.sf-control` / `.sf-control-md`
- `.sf-control-lg`

Rules:

- Default to `--control-height-md` for interactive controls.
- Public routes should normally stay on the public container width.
- Admin can use the admin container width for denser operational layouts.
- Sticky headers, overlays, toasts, and loading indicators should use the layer tokens instead of hardcoded z-indexes when touched.

## 6. Typography Contract

The font stack remains clean UI typography only:

```txt
Inter, Manrope, system UI fallbacks
```

### Role tokens

- Display: `--type-display-size`, `--type-display-line-height`
- Page title: `--type-page-title-size`, `--type-page-title-line-height`
- Section title: `--type-section-title-size`, `--type-section-title-line-height`
- Card title: `--type-card-title-size`, `--type-card-title-line-height`
- Body: `--type-body-size`, `--type-body-line-height`
- Body small: `--type-body-sm-size`, `--type-body-sm-line-height`
- Label: `--type-label-size`, `--type-label-line-height`
- Caption: `--type-caption-size`, `--type-caption-line-height`
- Price: `--type-price-size`, `--type-price-line-height`

### Reusable utilities

| Role | Utility |
| --- | --- |
| Display | `.sf-display` and legacy `.sf-hero` |
| Page title | `.sf-page-title` and legacy `.sf-h1` |
| Section title | `.sf-section-title` and legacy `.sf-h2` |
| Card title | `.sf-card-title` and legacy `.sf-h3` |
| Body | `.sf-body` |
| Body small | `.sf-body-sm` |
| Label | `.sf-label` |
| Caption | `.sf-caption` |
| Price | `.sf-price` |

Rules:

- Display and page-title roles scale up at `sm` and above.
- Labels stay compact and scannable.
- Prices always use tabular numerals.
- Do not use decorative fonts in app UI.

## 7. Motion Contract

### Tokens

- Durations:
  - `--motion-duration-fast`
  - `--motion-duration-base`
  - `--motion-duration-slow`
  - `--motion-duration-page`
  - `--motion-duration-aesthetic`
- Easing:
  - `--motion-ease-standard`
  - `--motion-ease-emphasized`
  - `--motion-ease-exit`
  - `--motion-ease-linear`
- Distance and opacity:
  - `--motion-distance-xs`
  - `--motion-distance-sm`
  - `--motion-distance-md`
  - `--motion-distance-lg`
  - `--motion-opacity-hidden`
  - `--motion-opacity-soft`
- Stagger:
  - `--motion-stagger-tight`
  - `--motion-stagger-base`

### Categories

| Category | Use for | Default rule |
| --- | --- | --- |
| Progressive disclosure | content reveal inside a stable page | fade + upward translate only |
| Functional microinteractions | hover, focus, pressed, state confirmation | color, border, opacity, shadow, and very small transform |
| Page / navigation | route or section swaps | faster than modal motion, never dramatic |
| Aesthetic motion | rare decorative warmth | subtle float only, never on core task UI |

### Reusable hooks

Class or attribute options:

- `.sf-motion-progressive` or `data-motion="progressive"`
- `.sf-motion-page` or `data-motion="page"`
- `.sf-motion-micro` or `data-motion="micro"`
- `.sf-motion-scale` or `data-motion="scale"`
- `.sf-motion-aesthetic` or `data-motion="aesthetic"`

Supported stagger markers:

- `data-stagger="1"`
- `data-stagger="2"`
- `data-stagger="3"`
- `data-stagger="4"`

### Motion rules

- Motion clarifies hierarchy or state; it does not perform decoration by default.
- Do not delay core content, totals, or confirmation copy behind animation.
- Use `transform` and `opacity` first.
- Keep micro-lift to `xs` distance only.
- Use aesthetic motion rarely and never inside checkout-critical UI.
- `prefers-reduced-motion: reduce` must disable these animation patterns cleanly.

## 8. Component State Standard

Every interactive component must still define:

- Default
- Hover where pointer exists
- Focus-visible
- Pressed / active where relevant
- Disabled
- Loading where async behavior exists
- Error where correction is possible

Focus must be keyboard-visible. Touch targets should not fall below `44px`, which maps directly to the control-height contract.

## 9. Review Checklist

- Are only semantic tokens used in new component styling?
- Does the page show clear canvas vs surface hierarchy?
- Do raised, floating, and modal surfaces use the correct elevation level?
- Are sticky and overlay layers using the shared z-index contract?
- Are typography roles reused instead of one-off heading sizes?
- Is motion reduced-motion safe and non-blocking?
- Does light mode still feel warm and controlled?
- Does dark mode remain readable and calm?
