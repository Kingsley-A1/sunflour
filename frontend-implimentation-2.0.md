# Frontend Implimentation 2.0 - Sunflour Bakery

Status: deeper frontend review and remaining work map  
Date: 2026-05-28  
Scope: remaining frontend work after the baseline Phase 0 to Phase 12 implementation recorded in `frontend-implimentation.md`.

## Source Documents

Read these before implementing any item in this document:

```txt
AGENTS.md
frontend-implimentation.md
backend-implementation.md
backend-implimenetation-2.0.md
docs/design-system.md
docs/frontend-routes.md
docs/component-contracts.md
docs/api-contracts.md
docs/order-lifecycle.md
first-backend-review-26-05-27.MD
```

This document does not replace the original frontend plan. It turns the remaining launch work into a tighter second implementation plan.

## Review Verdict

The frontend is no longer at a blank planning stage. The repository already contains a working baseline for the public storefront, menu browsing, cart, checkout, invoice access, customer account views, reviews, admin dashboard, order operations, catalog controls, delivery/payment/email/review settings, design tokens, shared UI primitives, and route groups.

The remaining work is production hardening. The strongest next path is to close contract drift, make the frontend role-aware, strengthen checkout/idempotency behavior, finish admin edit flows, run real component/E2E/accessibility/performance checks, configure image delivery, and prove the app on a Vercel Preview with production-like environment variables.

Do not restart the frontend. Keep the existing route/component structure and improve it slice by slice.

## Operating Role

You are the frontend production-readiness agent for Sunflour Bakery.

Your job is to make the existing Next.js 16 frontend trustworthy enough for customers, staff, and the business owner. Work from the already implemented surfaces, preserve the product rules, and only add abstractions when they remove real duplication or prevent production mistakes.

## Intent

Move the frontend from "baseline implemented" to "launchable with evidence."

Launchable means:

- Customers can browse, add to cart, choose pickup or delivery, see the delivery quote, create an order, view the invoice, and send WhatsApp proof without confusion.
- Staff can use the admin dashboard and operational screens without bypassing backend rules.
- Sensitive admin actions are role-aware in the UI and enforced by the backend.
- The frontend never treats displayed cart values as trusted totals.
- Core flows are covered by unit, component, E2E, accessibility, and preview-deployment checks.

## Constraints

- Use `pnpm` only.
- Keep Next.js App Router route groups: `(public)`, `(customer)`, `(admin)`, and `api/v1`.
- Do not move backend business logic into client components.
- Do not trust cart prices, delivery fees, surcharge, totals, product availability, payment status, or role permissions from the browser.
- Do not hardcode SVG icons where `lucide-react` or the real logo should be used.
- Do not hardcode product images or menu data as final business truth.
- Do not expose payment settings outside allowed post-checkout/admin contexts.
- Do not add a heavy UI library unless the maintainer approves it.
- Preserve mobile-first design and dark-mode usability.
- Keep route handlers and server modules as the authority for auth, RBAC, pricing, checkout, invoices, reviews, and audit behavior.

## No-Goals

- Do not redesign the brand from scratch.
- Do not replace the current component system with a third-party design system.
- Do not build marketing automation, newsletter signup, birthday campaigns, or promotional email UI.
- Do not add online card payment unless the maintainer approves a payment provider phase.
- Do not make guest checkout require login.
- Do not make admin access depend on hidden frontend links.
- Do not generate fake production data to hide missing backend or environment configuration.

## Current Implementation Snapshot

| Area | Current state | Remaining risk |
| --- | --- | --- |
| Design foundation | Tokens, dark-mode variables, primitives, layout shells, formatter utilities, and status maps exist. | Component tests are not fully wired because `vitest.config.ts` only includes `*.test.ts`, while `src/tests/frontend/primitives.test.tsx` is excluded. |
| Public routes | Homepage, menu, products, cart, checkout, invoice, reviews, about, contact, privacy, and terms exist. | Mobile QA, loading/error coverage, remote image config, E2E flow proof, and accessibility audit are still missing. |
| Cart and checkout | Local cart, delivery zones, delivery quote, idempotency header, checkout form, payment instruction, invoice link, and WhatsApp handoff exist. | Idempotency key is created at submit time and not preserved across retry, cart availability is not refreshed before checkout, and frontend error handling does not yet map all field errors. |
| Customer account | Profile, authenticated order history, order detail, and invoice access exist. | Guest lookup UX and authenticated ownership failure states need full journey testing. |
| Reviews | Public approved review list and review submission exist. Admin moderation page exists. | `ReviewForm` uses raw `fetch` and has stale copy saying backend reviews are waiting, even though the endpoint exists. |
| Admin dashboard | Dashboard metrics page uses backend service data. | Needs role-specific navigation polish, empty/error state proof, and responsive table/card QA. |
| Admin orders | List, detail, actions, payment status update, notes, and timeline surfaces exist. | UI duplicates transition rules and should not become a second source of truth. Delivery-method-specific status options and backend rejection handling need hardening. |
| Admin catalog | Product list, create/edit form, variants, images, status update, categories, and media upload exist. | Moderator UI can display controls it may not be allowed to use. Image upload depends on external image/domain configuration and final R2 behavior. |
| Admin delivery/payment/email | Basic settings screens exist. | Delivery settings are create-heavy and not full manage/edit flows. Payment/email screens need role-aware restricted states, confirmation copy, and audit-context clarity. |
| Testing and CI | Unit/API/module tests exist. Lint/typecheck/build scripts exist. | No Playwright, axe, Lighthouse, React Testing Library, jsdom test environment, or Vercel Preview smoke script is configured. |

## High-Signal Findings

### F-01 - API contract documentation is still incomplete

`docs/api-contracts.md` still identifies itself as a placeholder and leaves route success shapes, error codes, side effects, audit behavior, and frontend trusted-value rules partially unchecked. The implemented frontend uses many backend services and routes, so this must be closed before launch to prevent contract drift.

Remediation phase: Phase 13.

### F-02 - TSX frontend tests are present but excluded

`src/tests/frontend/primitives.test.tsx` exists, but `vitest.config.ts` includes only `src/**/*.test.ts`. That means component coverage is weaker than the repository appears to suggest.

Remediation phase: Phase 19.

### F-03 - No E2E, axe, or Lighthouse gate exists

The current `package.json` has Vitest scripts but no Playwright, accessibility scan, or Lighthouse command. The original Phase 12 already lists real mobile QA, Playwright E2E, axe scans, Lighthouse, and Vercel Preview as remaining launch risks.

Remediation phase: Phase 19 and Phase 20.

### F-04 - External product image delivery is not configured

`next.config.ts` does not define `images.remotePatterns`. Public and admin product components use `next/image` with product image URLs from backend records. If Cloudflare R2 public URLs are absolute external URLs, image rendering can fail in production until the allowed remote origins are configured.

Remediation phase: Phase 18.

### F-05 - API client coverage is incomplete

`src/lib/api/client.ts` has a good shared request primitive but only wraps delivery and checkout. Several client components call `apiRequest` directly, and `ReviewForm` uses raw `fetch`. This weakens error normalization and makes field-error UX inconsistent.

Remediation phase: Phase 14.

### F-06 - Dialog and sheet accessibility is incomplete

`ConfirmDialog` and `Sheet` use `role="dialog"` and `aria-modal`, but they do not yet trap focus, restore focus, close on `Escape`, isolate background interaction, or use a portal. This is a WCAG and operational admin-risk gap.

Remediation phase: Phase 17.

### F-07 - Checkout retry idempotency needs strengthening

Checkout sends an `Idempotency-Key`, but the key is generated inside submit handling. A failed network response followed by retry can create a new key for the same order attempt. The frontend should preserve one key per checkout attempt until success, cart change, or deliberate reset.

Remediation phase: Phase 15.

### F-08 - Cart state can become stale

The cart stores product name, variant, price, image URL, and orderability for display. That is acceptable as a display snapshot, but the frontend needs a clear pre-checkout refresh or graceful checkout rejection flow when a product becomes hidden, out of stock, or repriced.

Remediation phase: Phase 15.

### F-09 - Admin UI is not fully role-aware

Backend RBAC is the authority, but the frontend should still avoid offering actions a moderator cannot complete. `ProductAdminClient` currently shows status options including `HIDDEN`, while moderator policy only allows availability changes. Delivery/payment/email pages are server-protected, but restricted-state handling and role copy need a stronger pass.

Remediation phase: Phase 16.

### F-10 - Admin delivery management is not yet complete CRUD UX

Delivery settings can create zones and surcharge rules, but full manage/edit/inactivate flows are not complete in the UI. The backend phase requires admin-editable zones and surcharge rules, not create-only controls.

Remediation phase: Phase 16.

### F-11 - Audit log viewer is not implemented in frontend route map

`docs/frontend-routes.md` includes `/admin/audit-logs`, and the backend review work points toward audit visibility. The frontend still needs an audit log route once the backend endpoint is finalized.

Remediation phase: Phase 16.

### F-12 - Route loading, error, empty, and pagination behavior is partial

Some routes have strong empty/error states. Other admin tables have simple table fallbacks and static pagination text without full navigation. High-traffic and admin-critical routes need a pass for loading, error, empty, not-found, retry, and pagination states.

Remediation phase: Phase 14 and Phase 16.

### F-13 - Invoice rendering works but needs production proof

The invoice page renders stored HTML snapshots in an iframe and exposes print. This supports stable invoices, but it needs print/PDF proof, mobile proof, iframe height proof, and security review around snapshot source assumptions.

Remediation phase: Phase 15 and Phase 19.

### F-14 - Visual and content readiness still depends on real business assets

The app uses the real logo asset and a menu hero image, but production quality still depends on official menu photos, alt text, delivery zones, Moniepoint settings, WhatsApp number, contact details, and owner-approved copy.

Remediation phase: Phase 18 and Phase 21.

## Phase 13 - Contract Closure and Frontend Source of Truth

### Goal

Close the frontend/backend contract gaps before more UI work is added. The frontend must know exactly which routes, response shapes, error codes, role permissions, and side effects it is allowed to depend on.

### Build

- Complete `docs/api-contracts.md` for every frontend-consumed route.
- Add missing success response shapes for public, customer, and admin endpoints.
- Add expected error codes and user-facing handling guidance.
- Add side effects for admin mutations: audit logs, order status events, payment events, email outbox writes, and media asset state changes.
- Mark trusted-value boundaries explicitly: frontend may display estimates, backend owns final values.
- Add the audit log endpoint contract if backend 2.0 finalizes it.
- Reconcile route docs with implemented route folders.
- Add a frontend contract checklist to every future phase prompt.

### Tests

- No runtime tests are required for documentation-only contract closure.
- Run `pnpm typecheck` after any type or DTO update caused by the contract pass.
- Run `pnpm test` if shared API types or status maps are changed.

### Acceptance Criteria

- `docs/api-contracts.md` no longer says the implemented backend route set is a placeholder.
- Every route consumed by frontend has success, error, auth, and side-effect notes.
- Admin-critical routes document required roles and audit expectations.
- Checkout and delivery contracts explicitly reject trusted totals from the frontend.
- Frontend route docs and API docs agree on route names and ownership.

### Agent Implementation Prompt

```txt
Role:
You are the frontend contract-closure agent for Sunflour Bakery.

Task:
Implement Frontend 2.0 Phase 13: Contract Closure and Frontend Source of Truth.

Intent:
Make frontend implementation depend on documented, typed, backend-owned contracts instead of assumptions.

Context:
Read AGENTS.md, frontend-implimentation.md, docs/frontend-routes.md, docs/component-contracts.md, docs/api-contracts.md, docs/order-lifecycle.md, and backend-implimenetation-2.0.md. Compare those documents to the actual route files in src/app/api/v1 and frontend consumers in src/app, src/components, src/lib/api, and src/types.

Constraints:
Use pnpm only. Do not change product rules. Do not invent backend fields. Do not expose secrets or admin-only data in public contracts. Keep the frontend as a consumer of backend authority.

Few examples:
- If checkout returns fieldErrors, document how checkout maps them to fields.
- If payment rejection requires a reason, document both the backend error and the UI expectation.
- If product image upload completion changes media asset status, document the state path and expected UI state.

No-goals:
Do not redesign UI. Do not rewrite route handlers. Do not add a new API version.

Success criteria:
All frontend-consumed API routes are documented with request, success, error, auth, and side-effect behavior. Remaining product decisions are listed by exact owner question.
```

## Phase 14 - Typed API Client and Data Flow Hardening

### Goal

Make frontend data access predictable. Components should receive typed data and normalized errors instead of scattering request logic across UI files.

### Build

- Expand `src/lib/api/client.ts` into focused wrappers for public reviews, customer profile/orders, admin products, admin categories, admin delivery, admin payment, admin email, admin reviews, admin order actions, and media upload.
- Move `ReviewForm` away from raw `fetch` and onto the shared API client.
- Normalize `ApiClientError.fieldErrors` into form-level and field-level messages.
- Add a small error mapper for common codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `IDEMPOTENCY_CONFLICT`, `PAYMENT_SETTINGS_UNAVAILABLE`, `DELIVERY_ZONE_UNAVAILABLE`, `CHECKOUT_ITEM_UNAVAILABLE`, and invalid transition errors.
- Review server component data calls and keep them server-only where direct module calls are intentional.
- Add typed return DTOs for frontend-specific API payloads where domain types are incomplete.
- Add retry-safe UI behavior for recoverable GET requests.
- Add pagination query helpers for admin tables and customer order history.

### Tests

- Unit tests for `apiRequest` invalid JSON, API error envelope, field errors, and network failure.
- Unit tests for frontend error mapper.
- Component tests for review submission success, validation error, and rate-limit error once test tooling is wired in Phase 19.

### Acceptance Criteria

- No public/customer/admin form uses raw `fetch` directly unless the endpoint is an external upload URL.
- R2 upload to a presigned URL remains an explicit allowed exception and is wrapped with clear error handling.
- Field errors from backend can be displayed next to the matching form fields.
- Common API errors have user-friendly copy.
- Typed API wrappers cover every client component mutation.

### Agent Implementation Prompt

```txt
Role:
You are the frontend data-flow hardening agent for Sunflour Bakery.

Task:
Implement Frontend 2.0 Phase 14: Typed API Client and Data Flow Hardening.

Intent:
Remove scattered request behavior and make frontend API errors consistent across checkout, reviews, admin operations, and customer account flows.

Context:
Read src/lib/api/client.ts, src/types/api.ts, src/types/domain.ts, docs/api-contracts.md, and every client component that calls apiRequest or fetch.

Constraints:
Do not move backend business logic into the client. Do not calculate trusted totals. Keep external presigned upload PUT requests explicit and documented. Use TypeScript strict types.

Few examples:
- ReviewForm should call submitReview() from the API client and display rate-limit or validation errors.
- PaymentSettingsClient should call a payment wrapper instead of embedding the route path.
- OrderActionsClient should get normalized invalid-transition messages from shared error handling.

No-goals:
Do not introduce TanStack Query or a new data library unless approved. Do not refactor server modules.

Success criteria:
Client-side data calls are typed, centralized, and tested enough that frontend routes can handle backend rejections without confusing users.
```

## Phase 15 - Checkout, Cart, Invoice, and Payment Proof Reliability

### Goal

Make the revenue path resilient. A customer should be able to move from cart to checkout to invoice to WhatsApp proof without duplicate-order risk, stale-cart confusion, or payment-state ambiguity.

### Build

- Preserve one idempotency key per checkout attempt until success, cart mutation, or deliberate reset.
- Add a cart validation/preflight path before order creation if the backend exposes one; otherwise improve handling for checkout rejection due to unavailable items.
- Map checkout `fieldErrors` to form fields and keep a visible error summary for serious failures.
- Show `PAYMENT_SETTINGS_UNAVAILABLE` as a business setup issue, not a customer mistake.
- Make delivery quote loading state reliable by setting loading before every quote request.
- Prevent checkout submission while a delivery quote is required but still loading.
- Keep pickup visibly at NGN 0 delivery fee and no surcharge.
- Strengthen invoice page mobile and print behavior.
- Add invoice unavailable state with clear recovery copy.
- Confirm WhatsApp proof link opens with order number, amount, and invoice context.
- Keep payment copy honest: payment is pending until staff verifies it.

### Tests

- Unit tests for checkout idempotency-key lifecycle.
- Component tests for checkout validation errors and payment instruction rendering.
- E2E test: menu -> cart -> delivery quote -> checkout -> invoice -> WhatsApp proof link.
- E2E test: pickup checkout shows NGN 0 delivery fee and no surcharge.
- E2E test: checkout rejection for unavailable product shows a repair path.
- Print/screenshot proof for invoice on desktop and mobile.

### Acceptance Criteria

- Retrying the same checkout attempt does not generate a new idempotency key unless the user changes the cart or intentionally starts over.
- Checkout never submits frontend prices, fees, surcharge, or totals.
- Customer sees delivery base fee and surcharge separately before order creation.
- Payment instruction shows amount, order number, bank instruction snapshot, invoice link, and WhatsApp proof action.
- Invoice remains snapshot-based and works without email.

### Agent Implementation Prompt

```txt
Role:
You are the checkout reliability agent for Sunflour Bakery.

Task:
Implement Frontend 2.0 Phase 15: Checkout, Cart, Invoice, and Payment Proof Reliability.

Intent:
Make the money path safe for customers and honest for the business.

Context:
Read AGENTS.md money/payment/delivery rules, src/features/cart/cart-store.tsx, src/app/(public)/cart/cart-page-client.tsx, src/app/(public)/checkout/checkout-page-client.tsx, src/components/checkout, src/components/commerce/delivery-quote-summary.tsx, src/app/(public)/orders/[orderNumber]/invoice/page.tsx, and docs/api-contracts.md.

Constraints:
Frontend totals are display estimates only. Backend checkout recalculates everything. Do not mark payment confirmed from frontend. Do not make checkout depend on email.

Few examples:
- If delivery quote fails, tell the customer to choose pickup or retry the selected zone.
- If payment settings are missing, show that Sunflour setup is incomplete and prevent false payment instructions.
- If an item becomes out of stock, explain which item needs to be removed or refreshed.

No-goals:
Do not add online card payment. Do not add promotional upsells. Do not require login.

Success criteria:
The complete customer purchase flow is reliable, repeatable, and covered by unit/component/E2E tests.
```

## Phase 16 - Admin Operations UX Completion

### Goal

Make the admin UI operationally correct instead of merely reachable. Staff should see the actions they are allowed to take, understand what each action changes, and receive graceful backend rejection when policy blocks an action.

### Build

- Pass admin role to client admin components that need role-aware controls.
- Restrict moderator catalog status options to allowed availability updates.
- Keep super-admin controls visible only where server role and UI role agree.
- Replace client-owned order transition assumptions with backend-provided allowed actions if available; otherwise make backend rejection first-class in the UI.
- Adjust order status actions for delivery method: pickup should not encourage out-for-delivery flow.
- Add confirmation dialogs for payment rejection, order cancellation, and destructive/irreversible changes.
- Complete delivery zone edit, active/inactive, and surcharge rule edit flows.
- Add admin audit log route once the backend endpoint is stable.
- Add pagination controls for admin orders, reviews, email outbox, and future audit logs.
- Improve admin table keyboard usability and responsive behavior.
- Add restricted-state pages or cards for moderator access to payment, delivery, and email settings.

### Tests

- Component tests for moderator versus super-admin product controls.
- Component tests for order actions disabled/allowed states.
- Integration or E2E test for admin payment confirmation and rejection reason.
- E2E test for delivery zone edit/inactivate if backend route is available.
- E2E test for review moderation.

### Acceptance Criteria

- Admin UI does not offer sensitive actions to roles that cannot complete them.
- Backend remains the authority and every rejected mutation is shown clearly.
- Delivery settings can be created and edited without code changes.
- Payment/email settings communicate super-admin ownership and audit context.
- Admin order lifecycle UI does not create invalid operational expectations.

### Agent Implementation Prompt

```txt
Role:
You are the admin operations UX agent for Sunflour Bakery.

Task:
Implement Frontend 2.0 Phase 16: Admin Operations UX Completion.

Intent:
Make staff operations accurate, role-aware, and safe without weakening backend RBAC.

Context:
Read src/app/(admin), src/components/admin, src/components/layout/admin-shell.tsx, docs/order-lifecycle.md, docs/api-contracts.md, and AGENTS.md role rules.

Constraints:
Backend RBAC remains mandatory. UI role checks are convenience and clarity, not security. Do not let moderators edit payment settings, email settings, delivery pricing, hidden product state, or admin ownership.

Few examples:
- A moderator can update an active product to out of stock if policy allows it, but cannot hide a product.
- A rejected payment requires a reason before submission.
- A pickup order should move toward ready-for-pickup, not out-for-delivery.

No-goals:
Do not build analytics vanity charts. Do not expose raw audit internals to moderators. Do not add destructive hard-delete actions.

Success criteria:
Admin screens reflect real backend permissions and support daily operations without requiring code edits.
```

## Phase 17 - Accessibility and Interaction Hardening

### Goal

Bring the implemented UI to WCAG 2.2 AA readiness for the highest-risk flows: checkout, cart, product detail, invoice, review submission, and admin forms.

### Build

- Add focus trap, focus restore, `Escape` handling, and portal behavior to `ConfirmDialog` and `Sheet`.
- Ensure every icon-only button has an accessible label and tooltip where meaning is not obvious.
- Add error summaries to checkout and admin forms with links or clear references to fields.
- Ensure field-level errors use `aria-describedby` and `aria-invalid`.
- Review category tabs for correct keyboard behavior or convert them to buttons if they do not implement full tab semantics.
- Check color contrast in light and dark mode for all token states.
- Confirm status is never color-only.
- Ensure mobile tap targets are comfortable.
- Verify loading states preserve context and announce important changes when needed.
- Respect `prefers-reduced-motion` across cart, product, sheet, and toast interactions.

### Tests

- Component tests for dialog focus behavior.
- Component tests for checkout field errors and error summary.
- axe checks for homepage, menu, cart, checkout, invoice, reviews, admin dashboard, admin orders, and admin product form.
- Keyboard-only manual QA checklist for checkout and admin order update.

### Acceptance Criteria

- Dialogs and sheets are keyboard-safe.
- Checkout can be completed using keyboard and screen-reader-friendly form labels.
- Admin critical actions can be reviewed and confirmed without pointer-only interaction.
- Status meaning is communicated by text and structure, not color alone.
- Light and dark modes pass contrast checks for core flows.

### Agent Implementation Prompt

```txt
Role:
You are the accessibility hardening agent for Sunflour Bakery.

Task:
Implement Frontend 2.0 Phase 17: Accessibility and Interaction Hardening.

Intent:
Make customer checkout and admin operations usable through keyboard, screen readers, and high-contrast expectations.

Context:
Read docs/design-system.md, docs/component-contracts.md, src/components/ui, src/app/(public)/checkout, src/app/(public)/cart, src/components/admin, and src/app/(admin).

Constraints:
Use semantic HTML before custom widgets. Keep visuals consistent with existing tokens. Do not add a heavy component framework. Do not hide critical errors in toasts only.

Few examples:
- ConfirmDialog should focus the dialog title or first safe action when opened and restore focus after close.
- Checkout error summary should tell the customer which fields need correction.
- A status pill must include readable status text, not just color.

No-goals:
Do not redesign every page. Do not replace native select/radio controls with custom controls unless required.

Success criteria:
The highest-risk public and admin flows meet WCAG 2.2 AA expectations and have automated plus manual accessibility evidence.
```

## Phase 18 - Responsive Visual QA, Images, and Content Readiness

### Goal

Make the frontend look and behave like a polished bakery ordering product across real mobile, tablet, desktop, light mode, and dark mode.

### Build

- Configure `next.config.ts` `images.remotePatterns` for approved Cloudflare R2/public image origins.
- Verify product images render through `next/image` in menu, product detail, cart, and admin forms.
- Add graceful image fallback for broken remote assets.
- Confirm no text overflows cards, buttons, tabs, tables, sticky cart bar, checkout summaries, or admin controls at 320px, 360px, 390px, 768px, 1024px, and 1440px widths.
- Review homepage hero for first-viewport clarity and visible next-section hint.
- Replace placeholder copy with owner-approved business details where available.
- Confirm logo usage uses the real logo asset and icons use `lucide-react`.
- Add final alt text rules for product images and business photos.
- Review dark mode manually for customer flows and admin flows.
- Add print CSS proof for invoice.

### Tests

- Playwright screenshot checks for key pages at mobile and desktop sizes.
- Image render checks for product cards and product detail.
- Visual regression snapshots if a tool is approved.
- Manual real-device QA checklist for iPhone/Android sizes.
- Print-to-PDF invoice check.

### Acceptance Criteria

- Product and business images render reliably in local and Preview environments.
- No critical text overlaps or escapes containers on small mobile widths.
- Public pages feel warm, professional, and restrained.
- Admin pages remain dense enough for operations but usable on tablet/mobile.
- Invoice print output is readable and official-looking.

### Agent Implementation Prompt

```txt
Role:
You are the responsive visual QA and image readiness agent for Sunflour Bakery.

Task:
Implement Frontend 2.0 Phase 18: Responsive Visual QA, Images, and Content Readiness.

Intent:
Prove that the frontend is polished across devices and that real product imagery works in production-like environments.

Context:
Read docs/design-system.md, docs/frontend-routes.md, src/app/(public), src/components/commerce, src/components/layout, src/components/admin, next.config.ts, and the media API contract.

Constraints:
Use real logo/image assets or backend-managed product images. Do not hardcode SVG logos. Do not use decorative gradient/orb backgrounds as a substitute for product imagery. Keep font sizing stable and avoid viewport-width scaling.

Few examples:
- Add R2 remote image origins to next/image config.
- Verify product card titles wrap cleanly on 360px mobile.
- Ensure admin tables scroll predictably instead of crushing columns.

No-goals:
Do not rebrand Sunflour. Do not add animation libraries for polish.

Success criteria:
All high-traffic pages have screenshot evidence across mobile and desktop, with image loading and text fitting verified.
```

## Phase 19 - Test Automation, E2E, Accessibility, and Performance Gates

### Goal

Make frontend quality measurable. The project must stop relying on visual inspection and basic unit tests for launch-critical flows.

### Build

- Update `vitest.config.ts` so TSX tests are included.
- Add jsdom or a dedicated component-test config if needed.
- Add React Testing Library if component interaction tests require it.
- Add Playwright for E2E flows.
- Add axe accessibility checks for key pages.
- Add Lighthouse or an approved performance script for public pages.
- Add CI scripts for frontend-specific checks if useful:
  - `pnpm test:frontend`
  - `pnpm test:e2e`
  - `pnpm test:a11y`
  - `pnpm perf:lighthouse`
- Keep existing `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` as release gates.
- Add fixture or seed strategy for E2E data without leaking secrets.

### Tests

- Component tests:
  - `Button`
  - `Input`
  - `ConfirmDialog`
  - `Sheet`
  - `ProductCard`
  - `CartItemRow`
  - `CheckoutStepper`
  - `PaymentInstructionCard`
  - `OrderActionsClient`
  - `ProductEditorForm`
- E2E tests:
  - Guest menu -> cart -> checkout -> invoice -> WhatsApp proof.
  - Pickup order shows NGN 0 delivery fee.
  - Out-of-stock product cannot be ordered.
  - Review submission enters pending state.
  - Admin views dashboard.
  - Admin confirms payment.
  - Admin moves order through allowed lifecycle.
  - Admin edits product availability.
- Accessibility checks:
  - Homepage.
  - Menu.
  - Cart.
  - Checkout.
  - Invoice.
  - Reviews.
  - Admin dashboard.
  - Admin orders.
  - Admin product form.

### Acceptance Criteria

- TSX component tests actually run.
- E2E tests cover the customer money path and one admin operations path.
- axe checks run locally and in CI or an equivalent workflow.
- Lighthouse/performance check reports LCP, INP/TBT proxy, CLS, and accessibility score for public pages.
- Test data setup is repeatable and does not depend on production secrets.

### Agent Implementation Prompt

```txt
Role:
You are the frontend quality-gate agent for Sunflour Bakery.

Task:
Implement Frontend 2.0 Phase 19: Test Automation, E2E, Accessibility, and Performance Gates.

Intent:
Turn frontend launch quality into commands that can fail before customers find issues.

Context:
Read package.json, vitest.config.ts, src/tests/frontend, docs/component-contracts.md, docs/frontend-routes.md, and the implemented customer/admin routes.

Constraints:
Use pnpm only. Keep tests deterministic. Do not hit real payment, email, WhatsApp, or production services. Do not require production secrets for local checks.

Few examples:
- Include src/**/*.test.tsx in Vitest.
- Add Playwright E2E for guest checkout using seeded menu and payment settings.
- Add axe checks for checkout and admin order actions.

No-goals:
Do not chase 100 percent coverage. Do not add brittle screenshot assertions for every pixel.

Success criteria:
The frontend has automated proof for customer purchase flow, admin operational flow, component basics, accessibility, and public-page performance.
```

## Phase 20 - Preview Deployment and Remote Release Proof

### Goal

Prove the frontend works remotely on Vercel Preview before production. Local success is not enough for launch.

### Build

- Confirm Vercel project linkage.
- Confirm Preview and Production environment variables are separate.
- Confirm required frontend/backend-facing environment variables exist in Vercel:
  - database URL
  - Auth.js/NextAuth secret and Google OAuth settings
  - R2 account/bucket/access credentials and public image origin
  - Resend API key and sender settings
  - Moniepoint/payment settings seeded in database
  - WhatsApp proof number
  - admin allowlist
  - app URL/base URL
- Run migrations and seed strategy against Preview database only.
- Deploy a Preview build from the branch.
- Run smoke checks against the Preview URL:
  - homepage loads
  - menu loads seeded products
  - product image loads
  - cart loads
  - delivery quote works
  - checkout creates order
  - invoice opens from returned link
  - WhatsApp proof link is generated
  - admin sign-in works for allowlisted account
  - dashboard loads
  - admin order detail loads
- Record Preview URL and check results in a release note or deployment log.

### Tests

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e` against local environment.
- Preview smoke checks against remote URL.

### Acceptance Criteria

- Vercel Preview build passes.
- Required environment variables are present and separated by environment.
- Customer checkout and invoice access work on Preview.
- Admin dashboard and at least one admin order operation work on Preview.
- No `.env` secrets are committed.
- Release proof is documented before production promotion.

### Agent Implementation Prompt

```txt
Role:
You are the Vercel Preview release-proof agent for Sunflour Bakery.

Task:
Implement Frontend 2.0 Phase 20: Preview Deployment and Remote Release Proof.

Intent:
Prove that the frontend works outside localhost with production-like infrastructure and separated environment variables.

Context:
Read AGENTS.md deployment rules, docs/vercel-deployment.md, package.json, next.config.ts, .env.example, docs/api-contracts.md, and frontend-implimentation.md launch risks.

Constraints:
Do not commit .env. Do not use production database for preview. Do not expose secrets in logs or docs. Use Vercel Preview before Production.

Few examples:
- Verify menu images from R2 render on Preview.
- Create a test checkout order on Preview and open its invoice.
- Confirm a moderator cannot access payment settings.

No-goals:
Do not directly edit production settings. Do not promote to production without maintainer approval.

Success criteria:
Preview URL, environment readiness, smoke test results, and unresolved launch risks are documented.
```

## Phase 21 - Owner Content, Business Data, and Handoff

### Goal

Replace remaining assumptions with owner-approved business content and prepare the frontend for handoff.

### Build

- Confirm official business name format.
- Confirm official address, phone, WhatsApp number, opening hours, pickup instructions, and social links.
- Confirm Moniepoint payment instruction copy after backend payment settings are ready.
- Confirm delivery zone names, base fees, and surcharge wording.
- Confirm product/category names, descriptions, prices, variants, and availability.
- Upload real product photos through the admin media flow.
- Add meaningful alt text for product photos.
- Confirm legal/privacy/terms copy for v1.
- Add an admin operator checklist:
  - update product availability
  - create/edit product
  - upload product image
  - create/edit delivery zone
  - review payment proof
  - update order status
  - moderate review
  - resend/inspect email outbox when applicable
- Add a customer support checklist for failed checkout, missing invoice, and payment proof issues.

### Tests

- Manual content QA on mobile and desktop.
- Owner review of checkout copy and payment instruction.
- Admin handoff walkthrough on Preview.
- Image alt text review for representative products.

### Acceptance Criteria

- Public copy no longer depends on placeholder business information.
- Real menu/product data exists in the database.
- Product imagery is uploaded through controlled admin flow.
- Staff can operate the admin basics from a documented checklist.
- Customer-facing payment and delivery language is owner-approved.

### Agent Implementation Prompt

```txt
Role:
You are the frontend content and handoff agent for Sunflour Bakery.

Task:
Implement Frontend 2.0 Phase 21: Owner Content, Business Data, and Handoff.

Intent:
Make the product usable by real customers and staff with approved business data.

Context:
Read frontend-implimentation.md, docs/design-system.md, docs/frontend-routes.md, docs/api-contracts.md, and the current public/admin pages.

Constraints:
Do not invent official business data. Use placeholders only when clearly marked as awaiting owner confirmation. Do not bypass admin media upload for product images.

Few examples:
- Replace generic contact copy after the owner confirms address and WhatsApp.
- Upload product photos through signed R2 flow and add alt text.
- Document how staff moves an order from payment confirmed to delivered.

No-goals:
Do not add marketing campaign features. Do not create unsupported delivery promises.

Success criteria:
The frontend has real business content, real menu data, real imagery, and staff-ready operating notes.
```

## Final Frontend 2.0 Definition of Done

The remaining frontend work is done only when all items below are true:

- `docs/api-contracts.md`, `docs/frontend-routes.md`, and `docs/component-contracts.md` match implemented frontend behavior.
- Client mutations use typed API wrappers and normalized error handling.
- Checkout has stable idempotency behavior, clear field errors, backend quote handling, invoice access, and WhatsApp proof handoff.
- Public product images render locally and on Vercel Preview.
- Admin UI is role-aware while backend RBAC remains authoritative.
- Delivery zones and surcharge rules are manageable through admin UI without code changes.
- Dialogs, sheets, forms, and admin actions meet WCAG 2.2 AA expectations.
- TSX component tests run.
- Customer checkout E2E and admin operations E2E pass.
- axe checks run for checkout and admin-critical routes.
- Lighthouse or equivalent performance checks are documented for public pages.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass.
- Vercel Preview is verified with production-like, non-production environment variables.
- Owner-approved content, payment copy, delivery details, and product imagery are in place.
- No `.env` secrets, fake production data, or hidden frontend-only business rules are shipped.

## Recommended Implementation Order

1. Phase 13 - Contract Closure and Frontend Source of Truth.
2. Phase 19 - Test Automation foundation, especially TSX test inclusion.
3. Phase 14 - Typed API Client and Data Flow Hardening.
4. Phase 15 - Checkout, Cart, Invoice, and Payment Proof Reliability.
5. Phase 16 - Admin Operations UX Completion.
6. Phase 17 - Accessibility and Interaction Hardening.
7. Phase 18 - Responsive Visual QA, Images, and Content Readiness.
8. Phase 20 - Preview Deployment and Remote Release Proof.
9. Phase 21 - Owner Content, Business Data, and Handoff.

This order protects the work from drifting. Contracts and tests come first, then customer revenue flow, then admin operations, then visual/accessibility proof, then remote release evidence and owner handoff.

## Implementation Status Update - 2026-05-28

Completed in this frontend 2.0 pass:

- Phase 14: expanded the shared API client with typed wrappers and normalized error copy for checkout, reviews, customer profile, admin catalog, delivery, payment, email, media upload, order actions, and review moderation.
- Phase 15: strengthened checkout idempotency by keeping one key per unchanged cart attempt, mapped backend field errors to checkout fields, added an error summary, fixed quote loading behavior, and blocked delivery checkout while a quote is pending.
- Phase 16: made admin catalog controls role-aware, filtered order transitions by pickup/delivery method, added payment confirmation dialog behavior, completed simple delivery-zone and surcharge edit/reactivate flows, and added `/admin/audit-logs`.
- Phase 17: added focus trap, focus restore, portal rendering, backdrop/Escape dismissal, and keyboard behavior for `ConfirmDialog` and `Sheet`; category filters now use button semantics instead of incomplete tab semantics.
- Phase 18: configured `next/image` remote patterns from `R2_PUBLIC_BASE_URL` and added graceful image fallbacks for product, product detail, cart, and admin product media.
- Phase 19: TSX frontend tests now run; frontend API/idempotency tests were added; Playwright and axe smoke-test scripts/config were added.

Checks passed locally:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm db:validate
pnpm build
```

Playwright status:

```txt
pnpm test:e2e was attempted.
The first run exposed Next dev host mismatch and was fixed by using localhost.
The second run was blocked by local database state: Prisma reported public.categories does not exist.
Run migrations/seed against a safe local or Preview database before treating E2E/axe as complete.
```

Remaining external launch blockers:

- Vercel Preview project/environment variables are still required for Phase 20.
- Owner-approved address, WhatsApp number, Moniepoint copy, delivery zones/fees, operating hours, admin allowlist, email sender, R2 bucket/public URL, menu data, and real product photos are still required for Phase 21.
- Lighthouse or an equivalent performance run still needs a prepared local/Preview environment with seeded data.
