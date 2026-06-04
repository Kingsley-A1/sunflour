# Frontend Homepage, Loading, Mobile Navigation Agent Prompt

Use this prompt for the frontend agent that will professionalize global loading states, rebuild the public mobile navigation, refactor the homepage hero into a product-first food experience, and tighten page/footer layout.

```txt
Role:
You are the Sunflour Bakery frontend implementation agent acting with CTO-level discipline. You are a senior Next.js App Router + TypeScript + Tailwind v4 engineer with strong product-design judgment, mobile-first UX skill, accessibility discipline, and production ecommerce standards.

Intent:
Convert the current public frontend from website-feature presentation into a food-first ordering experience. The homepage must make customers hungry, the mobile shell must prioritize categories and fast ordering, loading states must feel professional everywhere, and admin controls must make hero/category merchandising maintainable without code changes.

Read first:
- AGENTS.md
- frontend-implimentation.md
- frontend-implimentation-2.0.md
- docs/frontend-design-benchmark-agent-prompt.md
- docs/design-system.md
- docs/frontend-routes.md
- docs/component-contracts.md
- docs/api-contracts.md
- prisma/schema.prisma
- src/app/globals.css
- src/components/ui/loading-state.tsx
- src/components/layout/public-shell.tsx
- src/components/layout/footer.tsx
- src/app/(public)/page.tsx
- src/app/(public)/about/page.tsx
- src/components/commerce/*
- src/components/admin/*
- src/server/modules/menu/*
- src/app/api/v1/public/menu/route.ts
- src/app/api/v1/admin/categories/*
- src/app/api/v1/admin/products/*

Strict rules:
- No JSX files. Use TSX only.
- Do not copy JSX from the benchmark.
- Do not hardcode SVG icons. Use lucide-react icons or real image assets.
- Remove menu.jpg from page heroes. Do not use menu.jpg as a hero image anywhere.
- Do not make all pages client components.
- Do not trust frontend prices, totals, delivery fees, payment state, or admin permissions.
- Do not fake most-clicked, most-bought, or hero-ranking data.
- Use pnpm only.
- Do not commit .env or secrets.

Core product rule:
Sunflour is a bakery ordering platform. Public pages should sell the food and make ordering clear. Do not use homepage sections to advertise generic website features like "Fast browsing" or "Invoice ready" unless the section is explicitly operational/help content. The homepage restaurant-quality section should communicate qualities of Sunflour Bakery: fresh baking, warm service, reliable preparation, clear pickup/delivery, clean ingredients/quality, and trust.

Primary outcomes:
1. Professionalize src/components/ui/loading-state.tsx and make it usable as the global route/page loading state pattern.
2. Replace the mobile public header's horizontal page nav with product categories.
3. Add a dedicated mobile sidebar/drawer for public navigation pages, ordered by customer priority.
4. Rebuild the homepage hero so it uses four clean product cards instead of menu.jpg.
5. Ensure homepage hero products are selected by a real backend/admin-controlled source with reliable fallbacks.
6. Add/admin-enable a hero product merchandising section so admins can update hero products without code changes.
7. Replace the homepage feature cards with restaurant-quality cards.
8. Make the footer shorter on mobile by placing Explore and Contact side by side.
9. Remove menu.jpg from all non-home heroes and make non-home page headers slim, small, and content-first.

Workstream 1: Global loading state
Refactor src/components/ui/loading-state.tsx into a professional reusable primitive.

Requirements:
- Support variants: page, section, card/list.
- Support optional title/label/description.
- Support skeleton count and layout density.
- Use aria-busy, aria-live, and readable text.
- Respect reduced motion.
- Use design tokens from globals.css.
- Avoid random spinner-only loading where skeleton context is better.
- Keep it lightweight; no new dependency.

Apply it globally:
- Add or update route loading files where appropriate:
  - src/app/loading.tsx if a root loading state exists or should exist.
  - Public/customer/admin route group loading.tsx files if the app structure needs contextual loading states.
- Use LoadingState for page-level loading where current loading states are absent or inconsistent.
- Do not block server-rendered pages unnecessarily.

Acceptance criteria:
- LoadingState works for full page loading, section loading, and compact card/list loading.
- Loading states do not cause layout jumps or hide important context.
- Loading states are accessible and professional in light/dark mode.

Workstream 2: Mobile public navigation and sidebar
Current issue:
src/components/layout/public-shell.tsx uses a mobile horizontal page nav. On mobile, this should become product-category-first navigation, while page links should move into a dedicated mobile sidebar/drawer.

Requirements:
- Mobile header keeps brand/logo, cart, and a menu/sidebar trigger.
- Mobile category rail replaces page nav below the header.
- Category rail uses active public categories from the backend/menu source.
- Category links should route to menu category views, e.g. /menu?category=<slug> or an existing supported category mechanism. If the current menu browser does not support query-param category selection, implement it cleanly.
- Show a few real known Sunflour-style category labels only as seeded/fallback data if the database has no active categories. Prefer actual DB categories.
- Mobile sidebar contains page links in priority order:
  1. Menu
  2. Cart
  3. Checkout
  4. Account
  5. Orders
  6. Reviews
  7. About
  8. Contact
  9. Privacy
  10. Terms
- Sidebar must be keyboard accessible, focus-managed, dismissible, and touch-friendly.
- Use lucide-react icons where helpful.
- Do not create a decorative sidebar. It is a navigation tool.

Admin category rule:
- Product categories already have admin CRUD. Reuse and strengthen existing category CRUD instead of duplicating it.
- If the category CRUD is incomplete for mobile category navigation needs, improve it with focused changes.
- Admin changes to category active state/order/name should naturally affect the mobile category rail.

Acceptance criteria:
- On mobile, users see product categories instead of generic page nav.
- All important public pages are reachable through the mobile sidebar.
- Category rail never breaks if categories are empty; it falls back safely to Menu.
- Admin category CRUD remains server-authorized and audited.

Workstream 3: Homepage hero product merchandising
Current issue:
src/app/(public)/page.tsx imports menu.jpg and presents a text-heavy hero. Replace this with a product-first hero that shows real products.

Requirements:
- Completely remove menu.jpg from the homepage hero.
- Hero must display exactly four clean product cards when possible.
- Product cards must be food-first, low clutter, and appetite-building:
  - image or graceful image fallback
  - product name
  - price
  - short category/availability signal if useful
  - no dense descriptions
  - no more than one compact badge
- Layout:
  - mobile: stable 2 x 2 product grid
  - tablet/desktop: four clean cards or a balanced 2 x 2 grid depending on composition
  - zero overlap, no viewport-width font scaling
  - stable image aspect ratios
- Place View menu and Review cart on the same row under the hero products on mobile and desktop when space allows. On very narrow 320px screens, keep them visually paired and professional without text overflow.
- Keep hero copy short. The products are the primary visual.
- Do not use dark overlays, gradient-orb decoration, or stock-like hero treatment.

Hero product source priority:
The hero must fetch products from multiple real sources in this order:
1. Admin-selected hero products.
2. Most clicked products.
3. Most recent uploaded/created active products.
4. Most bought products.
5. Featured/popular active products.
6. Seeded fallback active products.

Important:
- Do not fake most-clicked or most-bought metrics.
- If most-clicked data does not exist, implement minimal product-view/click tracking or skip that source with a documented reason and a real fallback.
- If most-bought data exists through order_items, use backend queries only.
- Only active public-visible products should appear. Out-of-stock may appear only if public visibility policy allows it, but CTA/orderability must be honest.
- The frontend must not decide trusted price or orderability beyond what backend returns.

Backend/admin merchandising:
- Add an admin-controlled hero product merchandising section.
- Prefer a clean explicit data model if existing isFeatured/isPopular flags cannot express ordered hero placement.
- Admin should be able to choose, order, activate/deactivate, and replace hero products.
- Admin updates must be server-authorized and audited.
- Keep API shape consistent with /api/v1/admin/* and /api/v1/public/*.
- Add Zod validation for admin inputs.
- Add tests for hero source fallback ordering and admin validation.

Acceptance criteria:
- Homepage hero always has products unless the entire catalog is empty.
- Hero never renders broken image layout.
- Admin can manage hero products without code changes.
- Fallback order is deterministic and tested.
- Old product/business rules remain intact.

Workstream 4: Restaurant-quality cards
Replace this homepage feature section:
- Fast browsing
- Clear delivery
- Invoice ready
- Manual verification

With restaurant-quality cards about Sunflour Bakery.

Possible content direction:
- Fresh from the bakery
- Warm Nigerian hospitality
- Pickup or delivery, prepared with care
- Honest portions and clear prices

Rules:
- This section should describe the restaurant/bakery qualities, not website features.
- Keep copy short, warm, and specific.
- Use lucide-react icons only.
- Keep cards compact and visually consistent with the benchmark.

Acceptance criteria:
- The section reads like a bakery/restaurant value section, not a software feature list.
- It supports trust and appetite without clutter.

Workstream 5: Footer mobile layout
Current issue:
src/components/layout/footer.tsx stacks Contact under Explore on mobile, making the footer too long.

Requirements:
- On mobile, Explore and Contact should sit side by side in a two-column footer area.
- Keep Ordering/Legal accessible without making the footer feel long.
- Preserve readable tap targets and line wrapping.
- Contact links must not overflow horizontally.
- Keep address readable.
- Maintain semantic footer/nav structure and accessible labels.

Acceptance criteria:
- At 320px and 360px widths, Explore and Contact are side by side without overflow.
- Footer is shorter, readable, and touch-friendly.

Workstream 6: Slim headers on non-home pages
Current issue:
menu.jpg appears in non-home page hero treatment, especially about page. Non-home pages should not have large marketing heroes.

Requirements:
- Remove menu.jpg from every page hero.
- Non-home public pages should use slim headers:
  - short eyebrow only if useful
  - concise H1
  - one sentence max supporting text, or no supporting text if content is clear
  - content begins quickly below header
- Main homepage is the only page with the rich product hero.
- Keep admin/customer pages operational and dense, not marketing-heavy.

Acceptance criteria:
- No page imports menu.jpg.
- Non-home pages show a slim header and then useful page content.
- Page headers do not dominate mobile viewport.

Implementation order:
1. Inspect current code and produce a concise implementation plan.
2. Confirm existing category CRUD and product flags/source data.
3. Build or refine backend hero-product service/API if needed.
4. Add admin hero merchandising UI.
5. Refactor public shell mobile navigation/sidebar.
6. Refactor LoadingState and route loading files.
7. Rebuild homepage hero and restaurant-quality cards.
8. Fix footer mobile layout.
9. Slim non-home headers and remove menu.jpg imports.
10. Add/update tests.
11. Run verification checks.

No-goals:
- Do not redesign the entire app.
- Do not replace the design system.
- Do not introduce a generic UI library.
- Do not add marketing automation.
- Do not change checkout/payment/delivery business rules.
- Do not make category or hero selection frontend-only.
- Do not leave placeholder admin controls.

Required tests/checks:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build

Recommended focused tests:
- Hero product source fallback returns four products when catalog has enough products.
- Admin hero product update validates product IDs and ordering.
- Public menu category query selects the expected category.
- LoadingState renders accessible labels.
- Mobile sidebar opens/closes and exposes priority links.
- Footer does not overflow at 320px.

Viewport checks:
Use Playwright or equivalent visual inspection for:
- 320px
- 360px
- 390px
- 768px
- 1024px
- 1440px

Critical pages:
- /
- /menu
- /about
- /cart
- /checkout
- /reviews
- /account
- /admin/categories
- /admin/products

Output before coding:
Return a short implementation plan with:
1. Data model/API changes needed, if any.
2. Files to edit.
3. How hero product fallback will work.
4. How mobile category nav/sidebar will work.
5. Risks and how you will avoid them.

Output after coding:
Return:
1. Summary of changed files.
2. Backend/API/schema changes.
3. Frontend component/page changes.
4. Admin controls added.
5. Tests/checks run.
6. Viewport checks performed.
7. Remaining risks or decisions.

Self-review gate:
Do not mark complete unless:
- menu.jpg is removed from all hero usage.
- Homepage hero uses four product cards.
- View menu and Review cart sit together below hero products.
- Mobile page nav is replaced by categories.
- Mobile sidebar has all priority pages.
- Admin has real hero/category merchandising control.
- LoadingState is global-ready and used consistently.
- Footer mobile layout is shorter and side-by-side for Explore/Contact.
- Required checks pass or any blocker is clearly unrelated and documented.
```
