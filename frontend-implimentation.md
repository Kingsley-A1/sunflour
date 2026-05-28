# Sunflour Bakery Frontend Implementation Plan

**Project:** Sunflour Bakery Restaurant Website + Ordering Platform  
**Document:** Frontend Implementation Plan  
**Scope:** Frontend only  
**Backend alignment:** `backend-implementation.md`  
**Standard:** Built for honour and for excellence  
**Primary users:** Mobile buyers, guest buyers, authenticated customers, moderators, super admins  
**Frontend style:** Mobile-first, API-first, accessible, fast, predictable, reusable, light by default, dark-mode ready  

---

## 1. Frontend Objective

Build a clean, mobile-first restaurant commerce experience that makes Sunflour Bakery feel trustworthy, fresh, simple, and professionally operated.

The frontend must power:

```txt
- Public homepage.
- Public menu and category browsing.
- Product details and variants.
- Cart and delivery quote.
- Checkout with clear order review.
- Manual Moniepoint payment instruction.
- Invoice access/download.
- WhatsApp proof-of-payment handoff.
- Customer profile and order history.
- Review submission.
- Admin dashboard.
- Admin order lifecycle management.
- Admin product/category/media management.
- Admin delivery-zone and surcharge management.
- Admin payment/email/review controls.
```

The experience must be predictable at all times. The user should always know:

```txt
Where am I?
What can I do here?
What will happen if I tap this?
How much am I paying?
What is delivery costing?
What happens after checkout?
What is the order status?
```

No hidden fees. No confusing buttons. No surprise payment assumptions. No bloated UI.

---

## 2. Product Architecture Decision

### 2.1 Frontend decision

Use **Next.js App Router** as the frontend application layer, backed by API-first backend routes already planned in `backend-implementation.md`.

```txt
Frontend framework: Next.js 16 App Router
UI runtime: React 19
Language: TypeScript strict mode
Styling: Tailwind CSS + CSS variables design tokens
Theme: Light default + system-aware dark mode
Data fetching: Server Components first, client fetching only where interaction needs it
Forms: React Hook Form + Zod resolver
State: URL state + server state first; Zustand only if cart/client state requires it
Components: Reusable app-specific components, not a generic bloated design system
Testing: Vitest, React Testing Library, Playwright, axe accessibility checks
Hosting: Vercel
Analytics: Vercel Web Analytics / Speed Insights later if approved
```

### 2.2 Frontend architecture principle

The frontend must not become a collection of random pages. It must be a disciplined interface system:

```txt
Design tokens -> primitives -> composed components -> page sections -> routes -> flows.
```

This gives us speed without disorder.

---

## 3. Industry Standards Review

This project should learn from the best systems without copying their surface style blindly.

### 3.1 Apple Human Interface Guidelines

**Reference:** https://developer.apple.com/design/human-interface-guidelines  
**Dark Mode:** https://developer.apple.com/design/human-interface-guidelines/dark-mode  
**Accessibility:** https://developer.apple.com/design/human-interface-guidelines/accessibility

Apple-level UI is not decoration. It is clarity, restraint, hierarchy, familiarity, spacing, feedback, and respect for user focus.

What Sunflour should learn:

```txt
- Make the main action obvious.
- Do not overload screens.
- Use generous spacing.
- Let content breathe.
- Use readable typography.
- Respect system dark mode.
- Build accessible controls from day one.
- Make states obvious: loading, success, empty, error, disabled.
- Avoid visual tricks that reduce trust.
```

How we apply it:

```txt
- One clear primary CTA per screen.
- Large mobile tap targets.
- Calm checkout steps.
- Sticky cart bar only when useful.
- Clear page titles and route context.
- Warm food imagery with controlled layout.
- Dark mode tokens that feel intentional, not auto-inverted.
```

### 3.2 Google Material Design 3

**Reference:** https://m3.material.io/  
**Color roles:** https://m3.material.io/styles/color/roles

Material Design is useful for structure, component states, density, surfaces, elevation, responsive behavior, and color role discipline.

What Sunflour should learn:

```txt
- Use semantic color roles, not random colors.
- Separate background, surface, primary, error, success, outline, and muted text.
- Use consistent component states: hover, focus, pressed, disabled, loading.
- Use predictable navigation patterns.
- Use cards only when they create grouping, not decoration.
```

How we apply it:

```txt
- Product cards use the same structure everywhere.
- Admin cards use the same metric/card shell.
- Inputs, selects, buttons, badges, sheets, dialogs, and tables share state tokens.
- Error and success colors are semantic, not decorative.
```

### 3.3 WCAG 2.2

**Reference:** https://www.w3.org/TR/WCAG22/  
**Quick reference:** https://www.w3.org/WAI/WCAG22/quickref/

WCAG exists so real people can use the product regardless of ability, device, network, or input method.

Target standard:

```txt
WCAG 2.2 AA for public flows and admin flows.
```

What Sunflour should enforce:

```txt
- Text contrast must meet AA.
- UI must work with keyboard.
- Forms must have labels.
- Errors must be clear and close to the field.
- Do not use color alone to communicate meaning.
- Focus states must be visible.
- Touch targets must be comfortable.
- Motion must respect reduced-motion preferences.
- Images must have useful alt text where meaningful.
```

### 3.4 GOV.UK Design System

**Reference:** https://design-system.service.gov.uk/  
**Validation:** https://design-system.service.gov.uk/patterns/validation/  
**Error summary:** https://design-system.service.gov.uk/components/error-summary/  
**Error messages:** https://design-system.service.gov.uk/components/error-message/

GOV.UK is excellent for forms, validation, error recovery, plain language, and predictable service journeys.

What Sunflour should learn:

```txt
- Tell users what went wrong.
- Tell users how to fix it.
- Put an error summary at the top of serious forms.
- Put field-level errors beside the affected field.
- Do not rely on browser-native validation alone.
- Use direct language, not clever language.
```

How we apply it:

```txt
Checkout errors must be human:
“Enter your phone number”
“Choose your delivery location”
“This item is currently out of stock”
“Delivery is not available for this location yet”
```

### 3.5 Shopify Polaris

**Reference:** https://polaris-react.shopify.com/  
**Components:** https://polaris-react.shopify.com/components

Shopify Polaris is a strong reference for admin experiences because it makes complex merchant operations feel structured.

What Sunflour should learn:

```txt
- Admin UI should be calm and operational.
- Admin actions should be obvious and grouped.
- Destructive actions require confirmation.
- Lists need filters, status badges, search, and clear row actions.
- Merchants need useful empty states, not blank screens.
```

How we apply it:

```txt
- Orders page has tabs/filters by status.
- Product page has availability and category filters.
- Delivery-zone manager uses simple editable rows/forms.
- Payment settings are visibly restricted to super_admin.
```

### 3.6 Stripe Checkout

**Reference:** https://stripe.com/payments/checkout  
**Checkout best practices:** https://stripe.com/gb/resources/more/checkout-screen-best-practices

Stripe Checkout is a useful reference for trust, payment clarity, error handling, and conversion-focused minimalism.

Sunflour is using manual Moniepoint transfer in v1, but the frontend should still feel disciplined.

What Sunflour should learn:

```txt
- Checkout should be short.
- Costs should be clear before commitment.
- Payment instruction should be unmistakable.
- Security/trust cues should be calm, not loud.
- Duplicate payment anxiety must be reduced.
```

How we apply it:

```txt
- Show subtotal, delivery base fee, 6 PM surcharge, and total before order creation.
- After checkout, show order number, account details, amount, invoice, and WhatsApp proof button.
- Never imply payment is confirmed until admin confirms it.
```

### 3.7 Vercel Commerce and Vercel Platform

**Vercel Commerce:** https://vercel.com/templates/next.js/nextjs-commerce  
**Next.js on Vercel:** https://vercel.com/docs/frameworks/full-stack/nextjs  
**Vercel for GitHub:** https://vercel.com/docs/git/vercel-for-github  
**Environment variables:** https://vercel.com/docs/environment-variables

Vercel Commerce is the closest frontend reference for the storefront standard: fast, server-rendered, composable, App Router-based, and performance-driven.

What Sunflour should learn:

```txt
- Make storefront pages fast by default.
- Use Server Components for product/menu rendering where possible.
- Use Suspense/loading UI to keep screens responsive.
- Keep client JavaScript small.
- Use Vercel Preview Deployments for every frontend change.
- Keep production env values out of source code.
```

How we apply it:

```txt
- Menu page uses server-rendered initial data.
- Search/filter can progressively enhance client-side.
- Product images use next/image with sizes and stable dimensions.
- Every PR gets a Vercel Preview before merge.
```

### 3.8 Google Core Web Vitals

**Reference:** https://web.dev/articles/vitals

Frontend quality must be measurable.

Targets:

```txt
LCP: <= 2.5s
INP: <= 200ms
CLS: <= 0.1
```

How we apply it:

```txt
- Use image optimization.
- Avoid layout shifts.
- Keep heavy scripts out of public pages.
- Use route-level loading states.
- Prefer server rendering for first content.
- Do not over-animate.
```

---

## 4. What Good Looks Like

Good is not “beautiful screenshots.” Good is a product that customers understand quickly and staff can operate daily.

### 4.1 Public storefront standard

```txt
Reference mix:
- Apple HIG restraint and polish.
- Material 3 component state discipline.
- Vercel Commerce speed and App Router structure.
- Stripe Checkout clarity.
- WCAG 2.2 accessibility.
```

Sunflour outcome:

```txt
A customer opens the site on a phone, sees fresh categories, finds food fast, understands price and delivery, places an order, gets clear payment instruction, downloads invoice, and sends proof on WhatsApp without confusion.
```

### 4.2 Checkout standard

```txt
Reference mix:
- Stripe Checkout for trust and low-friction flow.
- GOV.UK for form validation and error recovery.
- Apple HIG for calm step-by-step focus.
```

Sunflour outcome:

```txt
Every checkout step is obvious.
Every fee is visible.
The 6 PM + ₦500 delivery surcharge is shown clearly if applied.
Payment is manual, but the interface still feels professional and trustworthy.
```

### 4.3 Admin standard

```txt
Reference mix:
- Shopify Polaris for merchant/admin operations.
- Material 3 for components and state behavior.
- WCAG 2.2 for accessible tables, controls, and forms.
```

Sunflour outcome:

```txt
Admin sees today’s orders, pending payment confirmations, preparing orders, users, guests, cancellations, deliveries, delivered orders, sales estimate, top items, unavailable products, and pending reviews without hunting through raw data.
```

### 4.4 Vercel execution standard

```txt
Reference mix:
- Vercel Preview Deployments.
- Next.js App Router.
- Vercel Image Optimization.
- Environment separation.
```

Sunflour outcome:

```txt
Every frontend change is previewed, tested on mobile, checked for performance/accessibility, and then merged. No blind production edits.
```

---

## 5. Design Principles for Sunflour

### 5.1 Non-negotiable principles

```txt
1. Mobile-first, not mobile-afterthought.
2. Predictability before creativity.
3. Speed before decoration.
4. Accessibility before visual tricks.
5. Reusable components before one-off layouts.
6. One primary action per screen.
7. Clear pricing before checkout.
8. No hidden delivery logic.
9. Manual payment must feel structured.
10. Admin UI must feel operational, not decorative.
```

### 5.2 UI personality

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

### 5.3 What to avoid

```txt
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
```

---

## 6. Design Tokens

Use semantic tokens. Components should consume roles like `bg-surface`, `text-primary`, `border-default`, not raw brand colors everywhere.

### 6.1 Brand color foundation

Based on the Sunflour logo and bakery positioning:

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

### 6.2 Light mode semantic tokens

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

### 6.3 Dark mode semantic tokens

Dark mode must be designed, not inverted.

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

### 6.4 Theme rule

```txt
Default visual mode: Light.
System dark mode: Fully supported from day one.
Manual theme toggle: Optional in v1, recommended for admin.
Public site: Can follow system preference automatically.
Admin: Should include a visible theme toggle if cheap to implement.
```

Implementation options:

```txt
Option A: CSS-only using prefers-color-scheme. Fastest and simplest.
Option B: next-themes with system support and manual override. Better for admin and future preference saving.
```

Recommended:

```txt
Use next-themes only if it does not add complexity. Otherwise begin with CSS media query tokens and upgrade later.
```

### 6.5 Typography tokens

```txt
Primary UI font: Inter or Manrope.
Fallback: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif.
Logo typography: Do not recreate or distort the logo.
```

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

### 6.6 Radius, spacing, and elevation

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

### 6.7 Motion tokens

Motion should make the interface feel responsive, not flashy.

```css
--motion-fast: 120ms;
--motion-normal: 180ms;
--motion-slow: 260ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

Rules:

```txt
- Use motion for feedback, page transitions, modal/sheet entry, and cart updates.
- Respect prefers-reduced-motion.
- Do not animate core checkout information in a way that delays reading.
```

---

## 7. Component System

### 7.1 Component layers

```txt
1. Primitives
2. Form components
3. Commerce components
4. Admin components
5. Route sections
```

### 7.2 Primitives

```txt
Button
IconButton
Input
Textarea
Select
Checkbox
RadioGroup
Switch
Badge
Card
Sheet
Dialog
Drawer
Tabs
Toast
Skeleton
Separator
Avatar
EmptyState
ErrorState
LoadingState
ConfirmDialog
```

### 7.3 Commerce components

```txt
CategoryPills
ProductCard
ProductGrid
ProductDetailSheet
VariantSelector
QuantityStepper
AddToCartButton
StickyCartBar
CartItemRow
DeliveryZoneSelector
DeliveryQuoteSummary
CheckoutStepper
OrderSummaryCard
PaymentInstructionCard
InvoiceCard
WhatsAppProofButton
ReviewForm
ReviewCard
```

### 7.4 Admin components

```txt
AdminShell
AdminSidebar
AdminTopbar
MetricCard
StatusBadge
OrderStatusTimeline
OrderTable
OrderFilters
ProductTable
ProductEditorForm
CategoryEditorForm
DeliveryZoneTable
SurchargeRuleForm
PaymentSettingsForm
EmailTemplateList
ReviewModerationList
AuditLogTable
```

### 7.5 Component rules

```txt
- Components accept typed props.
- No component fetches data unless it is explicitly a route-level server component or isolated data component.
- No component hardcodes backend business rules.
- No component calculates trusted totals.
- No component creates random colors outside tokens.
- Every interactive component has focus, loading, disabled, and error states.
```

---

## 8. Frontend Folder Structure

```txt
src/
  app/
    (public)/
      page.tsx
      menu/
        page.tsx
        loading.tsx
        error.tsx
      products/[slug]/
        page.tsx
      cart/
        page.tsx
      checkout/
        page.tsx
      orders/[orderNumber]/invoice/
        page.tsx
      reviews/
        page.tsx
    (customer)/
      account/
        page.tsx
      account/orders/
        page.tsx
    (admin)/
      admin/
        layout.tsx
        page.tsx
        orders/
          page.tsx
          [id]/page.tsx
        products/
          page.tsx
          new/page.tsx
          [id]/page.tsx
        categories/
          page.tsx
        delivery/
          page.tsx
        reviews/
          page.tsx
        settings/
          payment/page.tsx
          email/page.tsx
    api/
      // backend route handlers live here per backend plan
  components/
    ui/
    commerce/
    admin/
    forms/
    layout/
    feedback/
  features/
    menu/
    product/
    cart/
    checkout/
    orders/
    reviews/
    admin-dashboard/
    admin-orders/
    admin-products/
    admin-delivery/
    admin-settings/
  lib/
    api/
    auth/
    money/
    dates/
    theme/
    validation/
    accessibility/
  styles/
    globals.css
    tokens.css
  types/
    api.ts
    domain.ts
```

---

## 9. Routes and Screens

### 9.1 Public routes

```txt
/                         Homepage
/menu                     Menu catalog
/products/[slug]          Product details, optional page route
/cart                     Cart
/checkout                 Checkout
/orders/[orderNumber]/invoice  Invoice view/download
/reviews                  Public reviews/review form
```

### 9.2 Customer routes

```txt
/account                  Profile overview
/account/orders           Order history
/account/orders/[orderNumber]  Order details
```

### 9.3 Admin routes

```txt
/admin                    Dashboard
/admin/orders             Order list
/admin/orders/[id]        Order detail + lifecycle
/admin/products           Product list
/admin/products/new       Create product
/admin/products/[id]      Edit product
/admin/categories         Category manager
/admin/delivery           Zones + 6 PM surcharge rule
/admin/reviews            Review moderation
/admin/settings/payment   Moniepoint/payment settings
/admin/settings/email     Email template/settings control
/admin/audit-logs         Super_admin view later
```

---

## 10. Public UX Flow

### 10.1 Homepage

Goal:

```txt
Make Sunflour feel fresh, trusted, local, and easy to order from.
```

Build:

```txt
- Hero with warm bakery message.
- View Menu primary CTA.
- WhatsApp secondary CTA.
- Featured categories.
- Popular items.
- Delivery/payment clarity block.
- Reviews preview.
- Location/contact/socials.
```

Acceptance:

```txt
- User understands what Sunflour sells within 5 seconds.
- Primary action is obvious.
- Page works beautifully on 360px mobile width.
- No layout shift from images.
```

### 10.2 Menu

Goal:

```txt
Help users find what they want quickly.
```

Build:

```txt
- Search.
- Category pills.
- Product grid/list.
- Availability badges.
- Product detail sheet.
- Add to cart.
- WhatsApp enquiry.
- Empty state.
- Loading skeleton.
```

Acceptance:

```txt
- Menu loads fast.
- Search/filter does not feel heavy.
- Out-of-stock items cannot be ordered.
- Product cards remain readable and consistent.
```

### 10.3 Cart

Goal:

```txt
Make order review and delivery quote simple.
```

Build:

```txt
- Cart item list.
- Quantity controls.
- Delivery/pickup selector.
- Delivery zone selector.
- Delivery quote summary.
- Subtotal, delivery base fee, surcharge if applicable, total.
- Continue to checkout.
```

Acceptance:

```txt
- User sees delivery fee before checkout.
- 6 PM surcharge is visible when applied.
- Cart updates feel instant.
- Totals from frontend are treated as display only.
```

### 10.4 Checkout

Goal:

```txt
Convert without confusion.
```

Build:

```txt
Step 1: Customer details.
Step 2: Delivery/pickup details.
Step 3: Review order.
Step 4: Create order.
Step 5: Payment instruction + invoice + WhatsApp proof.
```

Acceptance:

```txt
- User can complete checkout without email.
- Authenticated user can reuse profile data.
- Guest buyer can complete order quickly.
- Errors are field-specific and human.
- Payment is not marked confirmed in UI until backend/admin confirms it.
```

### 10.5 Invoice

Goal:

```txt
Make the customer feel the order is official and traceable.
```

Build:

```txt
- Invoice header with logo.
- Order number.
- Customer snapshot.
- Items.
- Delivery fee and surcharge.
- Total.
- Payment instruction.
- Download/print button.
- WhatsApp proof button.
```

Acceptance:

```txt
- Invoice looks professional on mobile and print.
- Invoice totals match backend snapshots.
- User can print/save as PDF.
```

---

## 11. Admin UX Flow

### 11.1 Admin dashboard

Cards required from backend plan:

```txt
Today’s orders
Pending payment confirmation
Preparing orders
Total users
Number of guests
Cancelled orders
Out for delivery
Delivered orders
Total sales estimate
Top ordered items
Low/hidden/out-of-stock products
Recent reviews pending approval
```

Goal:

```txt
Give staff an operational control room, not a vanity dashboard.
```

Build:

```txt
- Responsive metric grid.
- Priority order queue.
- Recent pending payment confirmations.
- Top ordered items block.
- Pending review block.
- Low/hidden/out-of-stock block.
- Date range selector later.
```

Acceptance:

```txt
- Dashboard is useful on mobile and desktop.
- Critical statuses are visible above the fold.
- No sensitive payment settings exposed to moderator.
```

### 11.2 Admin orders

Goal:

```txt
Let staff move orders through the lifecycle safely.
```

Build:

```txt
- Status tabs/filters.
- Search by order number/customer phone.
- Order list with status badges.
- Order detail page.
- Payment status controls.
- Fulfillment status controls.
- Timeline of order status events.
- Admin notes.
- Confirmation dialogs for cancellation/rejection.
```

Acceptance:

```txt
- Moderator can process orders without seeing unnecessary settings.
- Invalid status transitions are not available in UI.
- UI still handles backend rejection gracefully.
```

### 11.3 Admin products/categories/media

Goal:

```txt
Make menu updates safe and fast.
```

Build:

```txt
- Product table.
- Category filter.
- Status filter.
- Product editor.
- Variant editor.
- Image upload through backend signed upload flow.
- Availability toggle.
- Hidden/out-of-stock controls.
```

Acceptance:

```txt
- Admin can update menu without code.
- Product image upload has preview, progress, and error handling.
- Product price changes do not imply old invoice changes.
```

### 11.4 Admin delivery and surcharge

Goal:

```txt
Make delivery pricing clear and editable.
```

Build:

```txt
- Delivery-zone list.
- Add/edit zone form.
- Active/inactive toggle.
- 6 PM surcharge rule form.
- Preview fee calculation helper.
```

Acceptance:

```txt
- Admin understands that 6 PM surcharge adds ₦500.
- UI clearly separates base fee from surcharge.
- Moderator access depends on backend permission.
```

### 11.5 Admin reviews

Goal:

```txt
Protect the public brand while collecting customer trust signals.
```

Build:

```txt
- Pending review queue.
- Approved/rejected/hidden filters.
- Approve/reject/hide actions.
- Rating and customer/order context.
```

Acceptance:

```txt
- Pending reviews never appear publicly until approved.
- Admin action gives clear feedback.
```

### 11.6 Admin settings

Goal:

```txt
Control sensitive business settings without exposing them carelessly.
```

Build:

```txt
- Payment settings page, super_admin only.
- Email settings/templates page, super_admin only.
- Clear restricted-state UI for moderator.
```

Acceptance:

```txt
- Moderator cannot access sensitive settings.
- Super_admin changes show confirmation and audit-context UI.
```

---

## 12. Frontend Data Strategy

### 12.1 Server Components first

Use Server Components for:

```txt
- Homepage content.
- Initial menu fetch.
- Product detail page.
- Invoice page.
- Admin dashboard shell where possible.
```

Use Client Components for:

```txt
- Search/filter interactions.
- Cart state.
- Checkout form.
- Product detail sheets.
- Admin table filters.
- Upload progress.
- Status update actions.
```

### 12.2 API client rules

```txt
- All API calls use typed wrappers.
- No raw fetch scattered through components.
- API errors return normalized UI-friendly messages.
- Money values are displayed using shared money formatter.
- Dates use shared date formatter.
```

Example structure:

```txt
lib/api/public.ts
lib/api/customer.ts
lib/api/admin.ts
lib/api/errors.ts
```

### 12.3 Server trust rule

The frontend may display estimates, but the backend is the source of truth.

```txt
Frontend can display subtotal.
Backend recalculates subtotal.
Frontend can display delivery quote.
Backend recalculates delivery quote during checkout.
Frontend can show surcharge.
Backend decides final surcharge.
```

---

## 13. Accessibility Requirements

### 13.1 Minimum standard

```txt
Target: WCAG 2.2 AA.
```

### 13.2 Required frontend accessibility practices

```txt
- Every input has a visible or accessible label.
- Every error has field-level explanation.
- Checkout has an error summary for serious validation failures.
- Focus state is visible on all interactive elements.
- Dialogs/sheets trap focus correctly.
- ESC closes dismissible dialogs.
- Buttons have accessible names.
- Icons are decorative unless meaningful.
- Product images have useful alt text.
- Color is never the only status indicator.
- Reduced motion is respected.
- Admin tables are keyboard usable.
```

### 13.3 Accessibility tests

```txt
- axe checks for key pages.
- Keyboard-only checkout test.
- Screen-reader label check for forms.
- Color contrast check for light and dark tokens.
- Reduced-motion smoke test.
```

---

## 14. Performance Requirements

### 14.1 Core Web Vitals targets

```txt
LCP: <= 2.5s
INP: <= 200ms
CLS: <= 0.1
```

### 14.2 Performance rules

```txt
- Use next/image for product and hero images.
- Always set image width/height or stable aspect ratio.
- Use responsive sizes.
- Prioritize only true above-the-fold hero image.
- Lazy-load below-fold product images.
- Avoid heavy animation libraries unless needed.
- Keep public pages mostly server-rendered.
- Use loading.tsx and skeletons for route segments.
- Split admin-heavy components away from public bundle.
- Avoid loading admin chart/table dependencies on public routes.
```

### 14.3 Vercel workflow

```txt
Every PR:
- Vercel Preview Deployment.
- Mobile smoke test.
- Checkout smoke test.
- Admin smoke test if admin touched.
- Lighthouse/mobile performance check for critical public routes.
```

---

## 15. Frontend Testing Strategy

### 15.1 Unit tests

Use for:

```txt
- Money formatting.
- Delivery quote display logic.
- Status badge mapping.
- Theme token utilities.
- API error normalization.
```

### 15.2 Component tests

Use for:

```txt
- ProductCard.
- ProductDetailSheet.
- CartItemRow.
- CheckoutStepper.
- PaymentInstructionCard.
- InvoiceCard.
- Admin MetricCard.
- OrderStatusTimeline.
- ProductEditorForm.
```

### 15.3 E2E tests

Use Playwright for:

```txt
- Guest menu -> cart -> checkout -> invoice -> WhatsApp proof link.
- Authenticated checkout with saved details.
- Product out-of-stock cannot be ordered.
- Admin logs in and views dashboard.
- Admin confirms payment.
- Admin moves order to preparing/out for delivery/delivered.
- Admin edits delivery zone.
- Review submission enters pending state.
```

### 15.4 Visual and accessibility checks

```txt
- Light mode product grid.
- Dark mode product grid.
- Checkout mobile.
- Invoice print view.
- Admin dashboard desktop.
- Admin orders mobile/tablet.
- axe scan for checkout/admin forms.
```

---

## 16. Frontend Implementation Phases

# Phase 0 — Frontend Product and UI Lockdown

## Goal
Lock the frontend standard before building screens.

## Build

```txt
- Confirm brand colors and logo usage.
- Confirm typography.
- Confirm public route map.
- Confirm admin route map.
- Confirm checkout steps.
- Confirm invoice layout requirements.
- Confirm dark-mode policy.
- Create frontend rules in AGENTS.md.
- Create UI component checklist.
- Create frontend acceptance checklist.
```

## Tests

```txt
- Design rule review.
- Mobile-first route review.
- Accessibility rule review.
```

## Acceptance criteria

```txt
- Frontend rules are approved.
- Color tokens are approved.
- Checkout flow is approved.
- Admin dashboard metric list is approved.
- No major UI coding begins without this standard.
```

## Outcome
A stable UI direction that AI agents can follow.

## Implementation prompt for AI agents

```txt
Role:
You are a senior product-minded frontend architect setting the UI rules for a mobile-first restaurant ordering platform. You specialize in Next.js App Router, design systems, WCAG 2.2 AA, Apple HIG clarity, Material state discipline, and operational admin UX.

Goal:
Lock the frontend standard so every later agent builds Sunflour UI from shared routes, tokens, components, and accessibility rules instead of inventing one-off screens.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- backend-implementation.md
- docs/design-system.md
- docs/frontend-routes.md
- docs/component-contracts.md
- docs/api-contracts.md

Current frontend facts:
- Sunflour is mobile-first, light-mode default, dark-mode ready, API-first, and built on Next.js App Router.
- The UI must feel warm, fresh, professional, accessible, and operationally useful.
- Design tokens, component contracts, and route contracts already define the implementation boundaries.

Task:
Implement Frontend Phase 0: Frontend Product and UI Lockdown.

Deliver these artifacts:
- Confirmed brand/token notes.
- Confirmed logo usage rules.
- Confirmed public route map.
- Confirmed admin route map.
- Confirmed checkout steps.
- Confirmed invoice layout requirements.
- Confirmed dark-mode policy.
- Frontend acceptance checklist updates.
- Any missing docs updates needed before UI coding begins.

Constraints:
- Use pnpm only.
- Do not write production UI until the rules are explicit.
- Do not hardcode SVG logos or decorative SVG illustrations when the real logo, product imagery, or an icon library should be used.
- Use logo/image assets for brand marks; do not recreate or distort the Sunflour logo with text or inline SVG.
- Use icon components from the approved icon library when available; do not scatter route-level inline SVG icons.
- Use semantic design tokens, not random raw colors.
- Keep mobile 360px usability, keyboard access, and dark mode in scope from the start.
- Do not invent backend fields or business rules.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Frontend rules confirmed
3. Decisions still needed
4. Checks run

Examples:
Use docs/design-system.md for tokens and accessibility rules, docs/frontend-routes.md for route scope, and docs/component-contracts.md for component boundaries.

Evaluation Criteria:
The implementation is good if:
- Later agents can implement frontend phases without guessing route, token, logo, icon, or accessibility rules.
- The checkout flow, invoice expectations, admin metric list, and dark-mode policy are explicit.
- No UI implementation begins on top of unresolved design/product rules.

Iteration:
Before final output, self-review against the Evaluation Criteria. If a rule is missing or contradictory, update the docs or list the exact decision required instead of proceeding silently.
```

---

# Phase 1 — Frontend Foundation and Design Tokens

## Goal
Create the reusable UI foundation.

## Build

```txt
- Configure Tailwind CSS.
- Add CSS variable tokens.
- Add light/dark semantic tokens.
- Configure typography.
- Build base primitives: Button, Input, Select, Card, Badge, Dialog/Sheet, Toast, Skeleton, EmptyState, ErrorState.
- Add layout utilities.
- Add money/date formatters.
- Add typed API client shell.
```

## Tests

```txt
- Unit tests for formatters.
- Component tests for Button/Input/Card states.
- Contrast check for critical tokens.
- Dark-mode smoke test.
```

## Acceptance criteria

```txt
- Tokens are used through components.
- No random hardcoded colors in components.
- Components have loading/disabled/focus states.
- Light and dark mode both render cleanly.
```

## Outcome
A reusable frontend foundation.

## Implementation prompt for AI agents

```txt
Role:
You are a senior frontend platform engineer building the reusable UI foundation for a Next.js 16, React 19, TypeScript strict, Tailwind CSS application.

Goal:
Create the token, primitive component, formatter, and typed API foundation that every public, customer, and admin screen will reuse.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/design-system.md
- docs/component-contracts.md
- docs/frontend-routes.md
- docs/api-contracts.md
- backend-implementation.md

Current frontend facts:
- The frontend architecture is design tokens -> primitives -> composed components -> route sections -> routes -> flows.
- Components must use semantic tokens and support light/dark mode.
- Primitives must define focus, loading, disabled, hover, pressed, and error states where relevant.

Task:
Implement Frontend Phase 1: Frontend Foundation and Design Tokens.

Deliver these artifacts:
- Tailwind/CSS token setup.
- Light and dark semantic color tokens.
- Typography, spacing, radius, elevation, and motion tokens.
- Base primitives: Button, Input, Select, Card, Badge, Dialog or Sheet, Toast, Skeleton, EmptyState, ErrorState.
- Money and date formatters.
- Typed API client shell and API error normalization.
- Initial tests for formatters and primitive states.

Constraints:
- Use pnpm only.
- Use CSS variables and semantic token names from docs/design-system.md.
- Do not hardcode raw brand colors in component JSX.
- Do not hardcode SVG icons inside primitives; use approved icon components where an icon is needed.
- Do not recreate the logo as text, CSS, or inline SVG.
- Keep primitives business-agnostic.
- Avoid adding UI libraries unless the value and accessibility behavior are clear.
- Every interactive primitive must have visible focus in light and dark mode.
- Public bundle weight matters; do not import admin-heavy code into shared public primitives.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Tokens and primitives added
3. Tests added
4. Checks run
5. Remaining gaps

Examples:
Follow Primitive Contracts in docs/component-contracts.md. Button and IconButton must use accessible names; IconButton needs aria-label and tooltip for unfamiliar icons.

Evaluation Criteria:
The implementation is good if:
- Tokens are the styling source of truth.
- Primitives are reusable and typed.
- Light and dark mode render intentionally.
- Focus, disabled, loading, and error states are covered.
- Formatters and API helpers are ready for later phases.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against the Evaluation Criteria and the Component Review Checklist. If any primitive violates token, accessibility, or SVG/icon rules, fix it before reporting completion.
```

---

# Phase 2 — App Shell, Routing, Loading, and Error States

## Goal
Make routing predictable and production-ready.

## Build

```txt
- Public app shell.
- Admin app shell.
- Mobile navigation.
- Header/footer.
- loading.tsx for key routes.
- error.tsx for key route groups.
- not-found.tsx.
- Global toast provider.
- Theme provider if using next-themes.
```

## Tests

```txt
- Route smoke test.
- Mobile navigation test.
- Loading state visual check.
- Error state visual check.
```

## Acceptance criteria

```txt
- Users always know where they are.
- Public and admin shells are clearly separated.
- Loading states do not shift layout violently.
- Dark mode applies to both shells.
```

## Outcome
Application shell ready for real flows.

## Implementation prompt for AI agents

```txt
Role:
You are a senior Next.js App Router frontend engineer building route shells, navigation, loading states, and error boundaries for a mobile-first commerce app.

Goal:
Make the public, customer, and admin surfaces feel clearly separated, navigable, accessible, and production-ready before real flows are added.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/frontend-routes.md
- docs/design-system.md
- docs/component-contracts.md
- docs/api-contracts.md

Current frontend facts:
- Route groups should separate public, customer, and admin surfaces.
- Users must always know where they are and what action is available.
- Loading, error, empty, and not-found states must preserve context and avoid layout shift.

Task:
Implement Frontend Phase 2: App Shell, Routing, Loading, and Error States.

Deliver these artifacts:
- Public app shell.
- Admin app shell.
- Mobile navigation.
- Header and footer.
- loading.tsx for key routes.
- error.tsx for key route groups.
- not-found.tsx.
- Global toast provider if the primitive exists.
- Theme provider only if it stays simple and aligns with the dark-mode policy.

Constraints:
- Use pnpm only.
- Keep route groups aligned with docs/frontend-routes.md.
- Do not make the whole app a Client Component.
- Use Server Components by default; add client boundaries only for interaction.
- Use the real logo asset if available; do not draw the logo with inline SVG or text.
- Use approved icon components for navigation icons; do not hardcode route-level SVGs.
- Navigation must be keyboard accessible and touch-friendly.
- Loading states must use stable dimensions and not cause violent layout shift.
- Public and admin bundles must remain separated.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Route shell structure
3. Loading/error states added
4. Tests or visual checks
5. Checks run

Examples:
Use docs/frontend-routes.md as the folder map and docs/component-contracts.md for AdminShell, AdminSidebar, AdminTopbar, EmptyState, ErrorState, LoadingState, and Toast behavior.

Evaluation Criteria:
The implementation is good if:
- Public and admin shells are visually and structurally distinct.
- Mobile navigation works at 360px width.
- Route loading and error states are useful and stable.
- Dark mode applies consistently.
- No hardcoded SVG logo/icon shortcuts appear where assets or icon components should be used.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against the Route Review Checklist and Design Review Checklist. Fix unclear navigation, missing state handling, or icon/logo rule violations before reporting completion.
```

---

# Phase 3 — Public Homepage and Menu

## Goal
Make the public storefront useful and fast.

## Build

```txt
- Homepage sections.
- Menu page.
- Category filter.
- Search UI.
- Product grid/list.
- ProductCard.
- ProductDetailSheet or product detail route.
- Add-to-cart affordance.
- WhatsApp enquiry affordance.
- Empty states.
```

## Tests

```txt
- Menu loads active products.
- Search/filter works.
- Out-of-stock product state displays correctly.
- Product card component tests.
- Mobile layout check.
```

## Acceptance criteria

```txt
- Menu is fast and readable on mobile.
- Product cards are not crowded.
- User can move from product interest to cart/enquiry quickly.
- Public pages use backend/public API contracts.
```

## Outcome
Sunflour has a polished public storefront.

## Implementation prompt for AI agents

```txt
Role:
You are a senior storefront frontend engineer building a fast, mobile-first restaurant menu experience with Next.js Server Components and accessible client interactions.

Goal:
Make Sunflour's public homepage and menu useful, fast, visually controlled, and easy to order from on small phones.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/frontend-routes.md
- docs/design-system.md
- docs/component-contracts.md
- docs/api-contracts.md
- backend-implementation.md

Current frontend facts:
- Public menu data must come from backend public API contracts.
- Product cards must be readable, stable, and not crowded.
- Out-of-stock products can be shown only when backend says they are visible, but cannot be ordered.

Task:
Implement Frontend Phase 3: Public Homepage and Menu.

Deliver these artifacts:
- Homepage sections with clear primary CTA to menu.
- Menu page with server-rendered initial data.
- Category filter.
- Search UI.
- Product grid/list.
- ProductCard.
- ProductDetailSheet or product detail route integration.
- Add-to-cart affordance.
- WhatsApp enquiry affordance.
- Loading, error, and empty states.

Constraints:
- Use pnpm only.
- Use next/image for real product, hero, logo, or bakery imagery with stable sizes.
- Do not create SVG hero illustrations, decorative inline SVGs, or hardcoded logo SVGs.
- Use approved icon components for buttons and small UI cues.
- Use semantic tokens and component contracts; no random colors.
- Keep public pages mostly server-rendered.
- Do not trust displayed product price as checkout authority.
- Do not hardcode products, categories, prices, or availability.
- Product images need useful alt text and stable aspect ratio.
- ProductCard must work at 360px mobile width.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Routes and components implemented
3. Data/API contracts used
4. Tests or visual checks
5. Checks run
6. Known gaps

Examples:
Use ProductCard, ProductGrid, ProductDetailSheet, CategoryPills, and SearchBar contracts from docs/component-contracts.md. Use /menu and /products/[slug] route rules from docs/frontend-routes.md.

Evaluation Criteria:
The implementation is good if:
- Homepage makes the primary action obvious.
- Menu loads active public products from the backend contract.
- Search/filter does not make the public bundle heavy.
- Out-of-stock state blocks ordering.
- Product cards remain readable and stable on mobile.
- Image and icon usage follows the no-hardcoded-SVG rule.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against the public route acceptance checklist. If the page looks polished but hides price, availability, loading, empty, or error state clarity, revise before reporting completion.
```

---

# Phase 4 — Cart, Delivery Quote, and 6 PM Surcharge Display

## Goal
Make pricing transparent before checkout.

## Build

```txt
- Cart page.
- Sticky cart bar.
- Quantity controls.
- Delivery/pickup selector.
- Delivery zone selector.
- Delivery quote call.
- Delivery fee breakdown.
- 6 PM surcharge display.
- Cart empty state.
```

## Tests

```txt
- Add/remove/update cart item.
- Delivery quote displays base fee.
- 6 PM surcharge displays when returned by backend.
- Pickup shows ₦0 delivery.
- Cart survives navigation if implemented client-side.
```

## Acceptance criteria

```txt
- User sees subtotal, delivery fee, surcharge, and total clearly.
- UI does not pretend frontend total is final authority.
- Cart is comfortable on small phones.
```

## Outcome
Cart becomes trustworthy and checkout-ready.

## Implementation prompt for AI agents

```txt
Role:
You are a senior frontend commerce engineer building cart and delivery quote UX for a manual-payment restaurant ordering platform.

Goal:
Make cart review and delivery pricing transparent before checkout while keeping backend-calculated fees authoritative.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/frontend-routes.md
- docs/design-system.md
- docs/component-contracts.md
- docs/api-contracts.md
- backend-implementation.md

Current frontend facts:
- Delivery quote comes from /api/v1/public/delivery/quote.
- Pickup shows NGN 0 delivery fee.
- Delivery base fee and 6 PM surcharge must be visually separate.
- Frontend totals are display estimates only; checkout recalculates server-side.

Task:
Implement Frontend Phase 4: Cart, Delivery Quote, and 6 PM Surcharge Display.

Deliver these artifacts:
- Cart page.
- Sticky cart bar.
- Cart item rows.
- Quantity controls.
- Delivery/pickup selector.
- Delivery zone selector.
- Delivery quote API call.
- Delivery fee breakdown with base fee, surcharge, and total.
- Empty cart state.
- Loading and error states for quote calls.

Constraints:
- Use pnpm only.
- Do not trust frontend totals as final checkout authority.
- Do not hardcode delivery zones, base fees, surcharge amounts, or available methods.
- Use backend quote response for delivery fee display.
- Use shared money formatter.
- Use RadioGroup/Select/QuantityStepper contracts.
- Use icons from approved icon components when needed; do not inline hardcoded SVG controls.
- Cart controls must be touch-friendly and keyboard usable.
- Error messages must explain what the user can do next.
- Do not hide 6 PM surcharge when backend returns it.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Cart state and quote flow
3. Components implemented
4. Tests added or changed
5. Checks run
6. Known gaps

Examples:
Use CartItemRow, QuantityStepper, DeliveryZoneSelector, DeliveryQuoteSummary, and StickyCartBar contracts from docs/component-contracts.md.

Evaluation Criteria:
The implementation is good if:
- Users can review cart contents and update quantities.
- Users can choose pickup or delivery.
- Backend quote shows base fee, surcharge, and total clearly.
- Pickup shows NGN 0 delivery.
- Empty, loading, and error states exist.
- UI copy never implies frontend totals are final authority.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against the Commerce Acceptance Checklist. If surcharge, pickup, quote error, or mobile ergonomics are unclear, revise before reporting completion.
```

---

# Phase 5 — Checkout, Payment Instruction, Invoice, and WhatsApp Proof

## Goal
Build the complete purchase flow.

## Build

```txt
- Checkout stepper.
- Customer details form.
- Delivery details form.
- Order review screen.
- Submit order action.
- Payment instruction screen.
- Invoice link/download/print screen.
- WhatsApp proof button.
- Field-level errors.
- Error summary.
```

## Tests

```txt
- Guest checkout success.
- Authenticated checkout success.
- Missing phone validation.
- Missing delivery zone validation.
- Out-of-stock checkout rejection handling.
- Invoice screen renders.
- WhatsApp proof URL contains order number and total.
```

## Acceptance criteria

```txt
- User can complete order without email.
- Payment instructions are clear.
- UI says payment is pending until admin confirmation.
- Invoice is accessible immediately after order.
- Checkout is calm, short, and mobile-first.
```

## Outcome
Sunflour can receive real orders through the website.

## Implementation prompt for AI agents

```txt
Role:
You are a senior checkout frontend engineer building a low-friction, mobile-first manual-payment checkout flow with excellent form validation and payment clarity.

Goal:
Let guests and authenticated customers create orders, receive payment instructions, access invoices, and send WhatsApp proof without confusion.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/frontend-routes.md
- docs/design-system.md
- docs/component-contracts.md
- docs/api-contracts.md
- backend-implementation.md
- docs/order-lifecycle.md

Current frontend facts:
- Checkout posts to /api/v1/public/checkout with Idempotency-Key.
- Email is optional.
- Backend returns order number, payment status, payment instruction snapshot, invoice URL, WhatsApp proof URL/message, subtotal, delivery fee, surcharge, and total.
- Payment must stay visibly pending until backend/admin confirmation.

Task:
Implement Frontend Phase 5: Checkout, Payment Instruction, Invoice, and WhatsApp Proof.

Deliver these artifacts:
- Checkout stepper.
- Customer details form.
- Delivery/pickup details form.
- Order review screen.
- Idempotent submit order action.
- Payment instruction screen.
- Invoice link/download/print screen.
- WhatsApp proof button.
- Field-level errors.
- Error summary for serious validation failures.
- Backend error handling for unavailable items, delivery zone errors, idempotency conflicts, and validation errors.

Constraints:
- Use pnpm only.
- Do not submit trusted prices, delivery totals, surcharge, or payment confirmation from the frontend.
- Use backend checkout response as the post-order source of truth.
- Do not require email.
- Do not mark payment confirmed before backend says it is confirmed.
- Use React Hook Form and Zod resolver if form foundation exists; backend validation remains authoritative.
- Use clear GOV.UK-style field errors.
- Use shared money/date/API helpers.
- Use InvoiceCard, PaymentInstructionCard, WhatsAppProofButton, CheckoutStepper, and OrderSummaryCard contracts.
- Use approved icons for copy/print/WhatsApp actions; do not hardcode inline SVG buttons.
- Keep checkout short, calm, and usable at 360px width.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Checkout flow implemented
3. API contracts used
4. Tests added or changed
5. Checks run
6. Risks or unresolved decisions

Examples:
Follow /checkout and /orders/[orderNumber]/invoice rules in docs/frontend-routes.md. PaymentInstructionCard must show pending payment honestly and must not confirm payment.

Evaluation Criteria:
The implementation is good if:
- Guest checkout succeeds without email.
- Authenticated checkout can reuse available profile data without blocking guests.
- Validation errors are field-specific and human.
- Backend checkout errors are recoverable.
- Invoice is accessible immediately after order creation.
- WhatsApp proof URL includes the backend-provided proof message/link.
- pnpm lint, pnpm typecheck, pnpm test, pnpm build, and relevant Playwright checks pass when available.

Iteration:
Before final output, self-review against checkout acceptance criteria and the Form/Error Standard. If the flow creates payment ambiguity, hidden fees, or inaccessible forms, revise before reporting completion.
```

---

# Phase 6 — Auth, Customer Profile, and Order History

## Goal
Give returning users convenience without blocking guests.

## Build

```txt
- Google sign-in UI.
- Account page.
- Saved profile details.
- Saved addresses.
- Customer order history.
- Order detail screen.
- Invoice access from order history. 
```

## Tests

```txt
- Guest can still order.
- Authenticated user sees own profile.
- User cannot see another user’s order in UI.
- Profile form validation works.
```

## Acceptance criteria

```txt
- Auth improves UX but does not create friction.
- Customer profile is simple and mobile-first.
```

## Outcome
Customer experience supports repeat orders.

## Implementation prompt for AI agents

```txt
Role:
You are a senior frontend engineer building customer account UX that improves repeat ordering without blocking guest checkout.

Goal:
Give authenticated customers a simple profile, saved details, order history, order detail, and invoice access while preserving the guest-first buying path.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/frontend-routes.md
- docs/design-system.md
- docs/component-contracts.md
- docs/api-contracts.md
- backend-implementation.md

Current frontend facts:
- Customer auth is convenience, not a checkout wall.
- Backend enforces ownership; UI must not pretend to be the security boundary.
- Customer order detail should link to invoice access.

Task:
Implement Frontend Phase 6: Auth, Customer Profile, and Order History.

Deliver these artifacts:
- Google sign-in UI.
- Account page.
- Profile details form.
- Saved address UI if backend supports it; otherwise a documented empty/deferred state.
- Customer order history.
- Customer order detail screen.
- Invoice access from order history/detail.
- Loading, empty, error, and restricted states.

Constraints:
- Use pnpm only.
- Do not make guest checkout harder.
- Do not expose another user's order in UI.
- Do not rely on UI checks as authorization; backend remains authority.
- Use typed customer API wrappers.
- Use shared StatusBadge/StatusPill mapping for order/payment states.
- Use semantic tokens and component contracts.
- Use approved icons for account/order actions; do not hardcode inline SVGs.
- Profile forms need labels, field errors, submit loading, and success/error states.
- Keep account pages mobile-first and sparse.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Customer routes implemented
3. Components implemented
4. Tests added or changed
5. Checks run
6. Known gaps

Examples:
Use /account, /account/orders, and /account/orders/[orderNumber] route rules from docs/frontend-routes.md. Use Status Contract from docs/component-contracts.md.

Evaluation Criteria:
The implementation is good if:
- Guest checkout remains available and obvious.
- Authenticated users can view their profile and own orders.
- Order history shows meaningful statuses and invoice links.
- Profile form validation is accessible.
- Empty order history has a clear next action.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against customer route acceptance criteria. If auth convenience starts acting like a checkout requirement, revise before reporting completion.
```

---

# Phase 7 — Reviews

## Goal
Collect trust signals safely.

## Build

```txt
- Public review form.
- Rating selector.
- Review submission success state.
- Approved reviews display.
- Pending explanation after submission.
```

## Tests

```txt
- Review form validates rating/comment/name.
- Submitted review shows pending success state.
- Public list displays only approved reviews.
```

## Acceptance criteria

```txt
- Reviews build trust without creating spam risk.
- User understands review may require approval.
```

## Outcome
Public trust layer ready.

## Implementation prompt for AI agents

```txt
Role:
You are a senior frontend engineer building public review UX for a restaurant brand where moderation and accessibility matter.

Goal:
Collect customer trust signals safely while making it clear that submitted reviews may require approval before becoming public.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/frontend-routes.md
- docs/design-system.md
- docs/component-contracts.md
- docs/api-contracts.md
- backend-implementation.md

Current frontend facts:
- Public reviews must show approved reviews only.
- Submitted reviews enter pending moderation.
- Review forms must be rate-limit friendly and accessible.

Task:
Implement Frontend Phase 7: Reviews.

Deliver these artifacts:
- Public reviews page.
- Approved review list.
- ReviewCard.
- Review submission form.
- Rating selector.
- Pending moderation success state.
- Empty, loading, and error states.
- Rate-limit and validation error handling.

Constraints:
- Use pnpm only.
- Do not render pending, rejected, or hidden reviews publicly.
- Do not let users choose review status.
- Use backend review API contracts; do not invent review fields.
- Use accessible labels and keyboard support for rating input.
- Status must not rely on color alone.
- Use approved icons for rating/star UI if available; do not hardcode repeated inline SVG stars in the route.
- Do not add testimonial carousel libraries or marketing automation.
- Keep copy direct and moderation-aware.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Review UI implemented
3. API contracts used
4. Tests added or changed
5. Checks run
6. Known gaps

Examples:
Use ReviewForm and ReviewCard contracts from docs/component-contracts.md and /reviews acceptance criteria from docs/frontend-routes.md.

Evaluation Criteria:
The implementation is good if:
- Public list displays approved reviews only.
- Review form validates rating, comment, and name.
- Submission success explains moderation.
- Rate-limit/backend errors are understandable.
- Rating UI is keyboard and screen-reader usable.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against the accessibility checklist and review route acceptance criteria. If moderation, keyboard use, or icon implementation is weak, revise before reporting completion.
```

---

# Phase 8 — Admin Shell and Dashboard

## Goal
Give Sunflour staff a clean operating dashboard.

## Build

```txt
- Admin layout.
- Admin sidebar/topbar.
- Dashboard metric cards.
- Priority order queue.
- Pending payment confirmation block.
- Top ordered items block.
- Pending reviews block.
- Hidden/out-of-stock block.
```

## Tests

```txt
- Admin route guard UI works.
- Dashboard loads backend metrics.
- Metric card states work: loading, empty, error.
- Mobile/tablet admin layout works.
```

## Acceptance criteria

```txt
- Admin sees operational priorities immediately.
- Dashboard matches backend metric definitions.
- Moderator does not see restricted settings.
```

## Outcome
Admin dashboard UI ready.

## Implementation prompt for AI agents

```txt
Role:
You are a senior admin-UX frontend engineer building an operational dashboard for restaurant staff. You optimize for scannability, role clarity, accessibility, and dense but calm interfaces.

Goal:
Give moderators and super admins an admin shell and dashboard that show operational priorities immediately without exposing restricted settings.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/frontend-routes.md
- docs/design-system.md
- docs/component-contracts.md
- docs/api-contracts.md
- backend-implementation.md

Current frontend facts:
- Admin UI should feel operational, not decorative.
- Dashboard metrics must come from backend, not frontend guesses.
- Moderators can view dashboard but should not see sensitive settings.

Task:
Implement Frontend Phase 8: Admin Shell and Dashboard.

Deliver these artifacts:
- Admin layout.
- Admin sidebar/topbar.
- Dashboard metric cards.
- Priority order queue.
- Pending payment confirmation block.
- Top ordered items block.
- Pending reviews block.
- Hidden/out-of-stock block.
- Loading, empty, error, restricted, and mobile/tablet states.

Constraints:
- Use pnpm only.
- Keep admin components separated from public bundles.
- Use backend dashboard metric contract only; do not guess metrics client-side.
- Use AdminShell, AdminSidebar, AdminTopbar, MetricCard, StatusBadge, and EmptyState contracts.
- Admin screens can be denser than public pages but must remain keyboard accessible.
- Do not use decorative charts or vanity visuals unless backed by a real operational need.
- Use approved icon components for nav/actions/metric cues; do not hardcode inline SVG icon sets.
- Do not expose payment/email sensitive settings to moderators.
- Use semantic tokens and dark-mode-ready surfaces.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Admin shell implemented
3. Dashboard sections implemented
4. Tests or visual checks
5. Checks run
6. Known gaps

Examples:
Use /admin route rules from docs/frontend-routes.md and Admin Component Contracts from docs/component-contracts.md.

Evaluation Criteria:
The implementation is good if:
- Admin sees current operational priorities above the fold.
- Metrics use backend values.
- Moderator restricted settings are hidden or represented as restricted states.
- Dashboard works on mobile/tablet/desktop.
- MetricCard states cover loading, empty, and error.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against Admin Acceptance Checklist and Design Review Checklist. If the screen becomes decorative, crowded, or dependent on frontend metric guesses, revise before reporting completion.
```

---

# Phase 9 — Admin Order Lifecycle UI

## Goal
Allow staff to operate orders end-to-end.

## Build

```txt
- Order list with filters.
- Search by order number/phone.
- Status badges.
- Order detail.
- Payment confirmation controls.
- Status transition controls.
- Order timeline.
- Admin notes.
- Cancel/reject confirmation dialogs.
```

## Tests

```txt
- Admin can filter orders.
- Admin can confirm payment if allowed.
- Admin can move order through valid statuses.
- UI handles backend invalid transition errors.
- Cancellation requires confirmation.
```

## Acceptance criteria

```txt
- Staff can process daily orders without developer help.
- Risky actions are guarded.
- Order timeline makes history understandable.
```

## Outcome
Admin order operations ready.

## Implementation prompt for AI agents

```txt
Role:
You are a senior frontend engineer building admin order operations for a manual-payment restaurant platform. You specialize in lifecycle UX, guarded actions, status clarity, and backend-error recovery.

Goal:
Let staff process daily orders end-to-end while preventing risky transitions and keeping order history understandable.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/frontend-routes.md
- docs/design-system.md
- docs/component-contracts.md
- docs/api-contracts.md
- docs/order-lifecycle.md
- backend-implementation.md

Current frontend facts:
- Backend enforces RBAC, payment confirmation, audit logs, and status transitions.
- UI should hide invalid transitions when known but must still handle backend rejection gracefully.
- Payment status and order fulfillment status are separate.

Task:
Implement Frontend Phase 9: Admin Order Lifecycle UI.

Deliver these artifacts:
- Order list with filters.
- Search by order number/phone.
- Status badges.
- Order detail page.
- Payment confirmation controls.
- Status transition controls.
- Order timeline.
- Admin notes.
- Cancel/reject confirmation dialogs.
- Loading, empty, error, and restricted states.

Constraints:
- Use pnpm only.
- Use backend admin order APIs; do not mutate lifecycle locally without API confirmation.
- Do not bypass backend audit behavior.
- Do not show invalid transitions as normal actions.
- Still handle backend invalid transition errors clearly.
- Use ConfirmDialog for cancellation, rejection, and any destructive/irreversible action.
- Use StatusBadge and OrderStatusTimeline contracts.
- Use text plus tone for statuses; never color alone.
- Use approved icons for filters/actions; do not hardcode inline SVG controls.
- Keep tables keyboard usable and readable on tablet/mobile.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Order routes implemented
3. Lifecycle actions implemented
4. Tests added or changed
5. Checks run
6. Risks or unresolved decisions

Examples:
Use /admin/orders and /admin/orders/[id] route rules from docs/frontend-routes.md. Use OrderTable, OrderFilters, StatusBadge, OrderStatusTimeline, and ConfirmDialog contracts.

Evaluation Criteria:
The implementation is good if:
- Admin can filter and search orders.
- Payment confirmation controls reflect role and backend policy.
- Valid lifecycle actions call backend endpoints and update UI after confirmation.
- Cancellation/rejection requires confirmation.
- Order timeline makes history understandable.
- Backend invalid transition errors are recoverable.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against order route acceptance criteria. If any risky action lacks confirmation, any status depends on color only, or any mutation bypasses backend authority, revise before reporting completion.
```

---

# Phase 10 — Admin Products, Categories, and Media

## Goal
Let Sunflour manage the menu without code changes.

## Build

```txt
- Product list.
- Product create/edit form.
- Variant editor.
- Category manager.
- Availability/status controls.
- Image upload with signed upload flow.
- Image preview/progress/error UI.
```

## Tests

```txt
- Admin can create product.
- Admin can edit product.
- Admin can set out of stock/hidden.
- Image upload handles success/failure.
- Product form validates price/category/name.
```

## Acceptance criteria

```txt
- Menu can be updated through admin UI.
- Product editor is not bloated.
- Media flow is safe and user-friendly.
```

## Outcome
Menu operations ready.

## Implementation prompt for AI agents

```txt
Role:
You are a senior admin frontend engineer building safe catalog-management UI for a restaurant menu with product images, categories, variants, and availability controls.

Goal:
Let Sunflour manage the menu through admin UI without code changes while preserving backend-controlled prices, visibility, and media safety.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/frontend-routes.md
- docs/design-system.md
- docs/component-contracts.md
- docs/api-contracts.md
- backend-implementation.md

Current frontend facts:
- Products, categories, variants, images, and status are backend-controlled.
- R2 uploads use backend signed upload flow.
- Product price updates must not imply old invoice changes.
- Moderators may have limited availability controls depending backend policy.

Task:
Implement Frontend Phase 10: Admin Products, Categories, and Media.

Deliver these artifacts:
- Product list.
- Category filter.
- Status filter.
- Product create/edit form.
- Variant editor.
- Category manager.
- Availability/status controls.
- Image upload with signed upload flow.
- Image preview/progress/error UI.
- Loading, empty, error, and restricted states.

Constraints:
- Use pnpm only.
- Do not hardcode products, categories, status rules, prices, or upload URLs.
- Use backend signed upload endpoints only.
- Validate product/category/variant forms client-side for UX and rely on backend validation for authority.
- Use ProductTable, ProductEditorForm, CategoryEditorForm, AdminUploadField or equivalent contracts.
- Use next/image or stable img dimensions for previews.
- Use approved icons for upload/edit/delete/status actions; do not hardcode inline SVG action icons.
- Do not create UI that suggests product price edits change old invoices.
- Destructive or critical changes require confirmation.
- Admin tables/forms must be keyboard accessible.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Catalog admin routes implemented
3. Media upload flow
4. Tests added or changed
5. Checks run
6. Risks or unresolved decisions

Examples:
Use /admin/products, /admin/products/new, /admin/products/[id], and /admin/categories route rules from docs/frontend-routes.md. Use admin product/media contracts from docs/component-contracts.md.

Evaluation Criteria:
The implementation is good if:
- Admin can create and edit products through backend APIs.
- Product forms validate name, category, price, status, variants, and images.
- Signed upload flow shows progress, success, and failure.
- Availability/status controls respect role policy.
- Product image previews are stable and accessible.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against Admin Acceptance Checklist and media route contracts. If upload, price, status, or destructive action behavior is ambiguous, document the exact backend/API decision needed.
```

---

# Phase 11 — Admin Delivery, Payment, Email, and Reviews

## Goal
Expose controlled business settings to the right roles.

## Build

```txt
- Delivery zone manager.
- 6 PM surcharge rule UI.
- Payment settings page.
- Email settings/templates list.
- Email outbox list/retry UI if backend supports it in v1.
- Review moderation page.
- Restricted access UI for moderator.
```

## Tests

```txt
- Super_admin can view sensitive settings.
- Moderator sees restricted state.
- Delivery-zone forms validate values.
- Surcharge rule form validates time/amount.
- Review moderation actions work.
```

## Acceptance criteria

```txt
- Sensitive settings are not casually exposed.
- Business rules are editable with clear warnings.
- Email controls are understandable and not noisy.
```

## Outcome
Admin settings and moderation ready.

## Implementation prompt for AI agents

```txt
Role:
You are a senior admin frontend engineer building controlled business settings and moderation UI for delivery, payment, email, and reviews.

Goal:
Expose sensitive operational controls only to the right roles while keeping delivery pricing, Moniepoint payment settings, transactional email, and review moderation understandable.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/frontend-routes.md
- docs/design-system.md
- docs/component-contracts.md
- docs/api-contracts.md
- backend-implementation.md
- docs/order-lifecycle.md

Current frontend facts:
- Delivery zones and 6 PM surcharge are backend-managed.
- Payment settings are super_admin-only.
- Email controls are transactional only; no marketing automation.
- Reviews require moderation before public display.

Task:
Implement Frontend Phase 11: Admin Delivery, Payment, Email, and Reviews.

Deliver these artifacts:
- Delivery zone manager.
- 6 PM surcharge rule UI.
- Payment settings page.
- Email settings/templates list.
- Email outbox list/retry UI if backend supports it.
- Review moderation page.
- Restricted access UI for moderators where appropriate.
- Confirmation dialogs for sensitive changes.
- Loading, empty, error, success, and restricted states.

Constraints:
- Use pnpm only.
- Do not expose payment settings to unauthorized roles.
- Do not put payment account details into public or shared UI.
- Do not hardcode delivery fees, surcharge amount, email template keys, or review statuses.
- Use backend APIs and typed wrappers.
- Use DeliveryZoneTable, SurchargeRuleForm, PaymentSettingsForm, EmailTemplateList, ReviewModerationList, and ConfirmDialog contracts.
- Use approved icons for actions/status cues; do not hardcode inline SVGs.
- Make 6 PM surcharge and base fee visually separate.
- Email UI must remain transactional; do not add campaign/newsletter concepts.
- Review moderation actions must give clear feedback and handle backend audit/permission errors.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Admin settings routes implemented
3. Role restrictions handled
4. Tests added or changed
5. Checks run
6. Risks or unresolved decisions

Examples:
Use /admin/delivery, /admin/reviews, /admin/settings/payment, and /admin/settings/email route rules from docs/frontend-routes.md. Use relevant admin component contracts from docs/component-contracts.md.

Evaluation Criteria:
The implementation is good if:
- Super_admin can manage sensitive settings through guarded UI.
- Moderator sees restricted states instead of sensitive controls.
- Delivery base fee and surcharge are clear.
- Payment settings changes require confirmation.
- Email controls are transactional and not noisy.
- Review moderation is accessible and status-safe.
- pnpm lint, pnpm typecheck, pnpm test, and pnpm build pass.

Iteration:
Before final output, self-review against the Admin UI Rules and sensitive-settings acceptance criteria. If sensitive settings leak, marketing email concepts appear, or surcharge/payment copy is unclear, revise before reporting completion.
```

---

# Phase 12 — Frontend Hardening and Launch Readiness

## Goal
Prepare the frontend for real customers.

## Build

```txt
- Accessibility pass.
- Performance pass.
- Dark-mode pass.
- Mobile device pass.
- Error/empty/loading state pass.
- SEO metadata.
- Open Graph image.
- PWA/installability later if needed.
- Final Vercel Preview review.
```

## Tests

```txt
- Playwright critical path tests.
- axe accessibility checks.
- Lighthouse mobile checks.
- Manual mobile testing: small Android, iPhone viewport, tablet.
- Dark mode visual check.
- Reduced-motion check.
- Print invoice check.
```

## Acceptance criteria

```txt
- Public critical flows pass.
- Admin critical flows pass.
- No major contrast/accessibility issues.
- Core Web Vitals targets are respected as much as possible before launch.
- Vercel Preview approved before production.
```

## Outcome
Frontend ready for production launch.

## Implementation status update — 2026-05-28

Status: frontend phases 0 through 12 have a production-oriented implementation baseline in the Next.js App Router app.

Completed:

```txt
- Phase 0: Product/UI lockdown docs remain the source of truth.
- Phase 1: Tailwind/PostCSS setup, semantic CSS tokens, dark mode, primitives, typed API helpers, status maps, money/date formatters, and frontend tests.
- Phase 2: Public/customer/admin route groups, public shell, admin shell, loading/error/not-found states, toast provider, and mobile navigation.
- Phase 3: Homepage, menu page, category filter, search, product grid/card, product detail route, and add-to-cart flow.
- Phase 4: Client cart, quantity controls, delivery/pickup selector, delivery-zone loading, backend delivery quote, base fee/surcharge display, and empty/error states.
- Phase 5: Guest checkout form, idempotent checkout submission, field-level errors, order review, payment instruction card, invoice link conversion, and WhatsApp proof handoff.
- Phase 6: Google sign-in entry, account profile display/update, customer order history, customer order detail, and invoice access from authenticated orders.
- Phase 7: Approved reviews list, review card, accessible rating input, public review submission, and pending-moderation success copy.
- Phase 8: Admin shell/dashboard using backend metrics, operational cards, top items, unavailable products, and pending reviews.
- Phase 9: Admin order list filters, order detail, status/payment actions, notes, timeline, and guarded status confirmation through backend APIs.
- Phase 10: Admin products, product create/edit form, category manager, availability controls, and signed media upload flow.
- Phase 11: Delivery zone/surcharge manager, super-admin payment settings with confirmation, transactional email template list, and review moderation UI.
- Phase 12: SEO metadata, responsive/dark-mode token pass, print invoice action, reduced-motion CSS, error/empty/loading state pass, and production build verification.
```

Phase 1-8 review improvements completed:

```txt
- Replaced starter shell with real route groups and clear public/admin separation.
- Forwarded refs through form primitives so React Hook Form and native accessibility work correctly.
- Removed fake dashboard/order/review/customer placeholders where backend endpoints now exist.
- Kept dashboard metrics backend-sourced only; no frontend metric guessing.
- Preserved checkout rule: frontend never submits trusted prices, delivery fees, surcharge, totals, or payment confirmation.
- Added explicit display-estimate copy for cart/checkout totals.
- Used real image assets for homepage/logo and lucide icon components instead of inline SVG shortcuts.
- Added pnpm workspace build-script approval config for pnpm 11 reproducibility.
```

Checks run:

```txt
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Local verification:

```txt
- Production server started with pnpm start.
- /, /menu, /cart, /checkout, and /reviews returned HTTP 200 locally.
- Browser plugin tooling was not exposed in this session, so automated screenshot/axe/Lighthouse checks were not run.
```

Remaining launch risks:

```txt
- Real mobile device QA, Playwright E2E, axe scans, and Lighthouse checks still need to run before production approval.
- Vercel Preview review still requires linked Vercel project access.
- Production readiness depends on valid DATABASE_URL, Google OAuth, R2, Resend, Moniepoint/payment settings, admin allowlist, and official business contact data.
- Product imagery quality depends on real uploaded menu photos through the signed media flow.
```

## Implementation prompt for AI agents

```txt
Role:
You are a principal frontend engineer performing launch-readiness hardening for a Next.js App Router commerce application on Vercel.

Goal:
Prepare the frontend for real customers and staff by closing accessibility, performance, dark-mode, mobile, error-state, SEO, and Vercel Preview gaps.

Context:
Read first:
- AGENTS.md
- frontend-implimentation.md
- docs/design-system.md
- docs/frontend-routes.md
- docs/component-contracts.md
- docs/api-contracts.md
- backend-implementation.md
- docs/vercel-deployment.md if present

Current frontend facts:
- Public critical path is menu -> cart -> checkout -> invoice -> WhatsApp proof.
- Admin critical path is dashboard -> orders -> payment confirmation -> lifecycle update.
- WCAG 2.2 AA, Core Web Vitals, mobile 360px, dark mode, and Vercel Preview review are launch requirements.

Task:
Implement Frontend Phase 12: Frontend Hardening and Launch Readiness.

Deliver these artifacts:
- Accessibility pass.
- Performance pass.
- Dark-mode pass.
- Mobile device pass.
- Error/empty/loading state pass.
- SEO metadata.
- Open Graph image setup using real/generative bitmap assets where appropriate.
- Print invoice check.
- Reduced-motion check.
- Final Vercel Preview review checklist.
- Playwright critical path tests where available.
- axe accessibility checks where available.

Constraints:
- Use pnpm only.
- Do not introduce broad UI rewrites during hardening.
- Do not add heavy dependencies unless the launch value is specific and documented.
- Do not create hardcoded SVG logos, decorative SVG hero art, or ad-hoc inline SVG icon sets.
- Use real logo/product/place imagery or generated bitmap assets where visual assets are needed.
- Use approved icon components for controls.
- Preserve backend-trusted pricing and payment rules.
- Public pages must keep small client bundles.
- All interactive controls need visible focus and accessible names.
- No text overflow on 360px mobile.
- All launch checklists must be actionable.

Output Format:
Return a concise closeout with these headings:
1. Files changed
2. Accessibility fixes
3. Performance fixes
4. Mobile/dark-mode fixes
5. SEO/preview checklist
6. Tests and checks run
7. Remaining launch risks

Examples:
Use the Accessibility Checklist, Performance Checklist, Design Review Checklist, Route Review Checklist, and Testing Contract from the docs.

Evaluation Criteria:
The implementation is good if:
- Public and admin critical flows pass.
- Checkout, invoice, admin dashboard, admin orders, and forms have accessible states.
- Core Web Vitals risks are reduced and documented.
- Dark mode looks intentional.
- Mobile 360px layouts do not overflow.
- Logo/icon/image usage follows the strict asset and no-hardcoded-SVG rules.
- pnpm lint, pnpm typecheck, pnpm test, pnpm build, and relevant Playwright/axe checks pass when available.

Iteration:
Before final output, self-review against all launch checklists. If any check requires external Vercel credentials, production assets, or manual device verification, document the exact owner action instead of marking it complete.
```

---

## 17. What to Build Now vs Later

### Build now

```txt
Public homepage
Menu/catalog
Product details
Cart
Delivery quote
6 PM surcharge display
Checkout
Manual payment instruction
Invoice screen/download/print
WhatsApp proof button
Google auth UI
Customer profile/order history
Review submission
Admin dashboard
Admin order lifecycle
Admin product/category/media manager
Admin delivery-zone manager
Admin payment settings
Admin email settings basic UI
Review moderation
Light and dark mode tokens
Accessibility baseline
```

### Reserve for later

```txt
Full loyalty system
Promotional campaign UI
Advanced customer segmentation
Live rider tracking
Kitchen display screen
Advanced inventory UI
Multi-branch UI
Mobile app
Advanced analytics charts
Push notifications
Saved payment methods
Coupons and discount engine
AI recommendation widgets
```

### Why

The first version must solve the current business operation:

```txt
Customers need menu, cart, checkout, payment instruction, invoice, and WhatsApp proof.
Admins need menu control, delivery fee control, order processing, review moderation, and dashboard visibility.
```

Everything else is growth-layer complexity.

---

## 18. AI-Agent-Ready Frontend Context

We are building with AI agents in VS Code: `@Codex`, `@Claude`, `@Copilot`, and similar tools.

### 18.1 Required files for frontend agents

```txt
/AGENTS.md
/CLAUDE.md
/.github/copilot-instructions.md
/docs/backend-implementation.md
/docs/frontend-implimentation.md
/docs/ui-components.md
/docs/design-tokens.md
/docs/frontend-routes.md
```

### 18.2 Agent rules

```txt
Project: Sunflour Bakery.
Frontend style: Mobile-first, accessible, light default, dark-mode ready.
Design system: Tailwind + CSS variable tokens.
Backend: API-first Next.js backend routes.
Hosting: Vercel.

Rules:
- Do not hardcode business rules that belong to backend.
- Do not trust frontend totals.
- Do not create random colors outside tokens.
- Do not create one-off components when a reusable component exists.
- Do not add UI libraries without approval.
- Do not add heavy animation unless necessary.
- Do not make checkout confusing.
- Do not hide delivery fee or surcharge.
- Do not show payment as confirmed unless backend says so.
- Do not expose admin settings to unauthorized roles.
- Keep public bundle light.
- Test mobile first.
- Test dark mode.
- Test accessibility basics.
```

### 18.3 Agent task packet format

```txt
Task:
Implement Frontend Phase X: [name].

Read first:
- docs/frontend-implimentation.md
- docs/backend-implementation.md
- docs/design-tokens.md
- AGENTS.md

Scope:
- Implement only the files needed for this phase.
- Do not redesign unrelated screens.
- Do not invent backend fields.
- Use existing tokens and components.

Acceptance criteria:
[paste from this document]

Required checks:
- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build
- pnpm test:e2e where relevant

Output expected:
- Changed files.
- Components created.
- Tests added.
- Known gaps.
```

### 18.4 Agent review checklist

Before accepting AI-generated frontend code:

```txt
Architecture:
- Is data fetching placed correctly?
- Are components reusable?
- Are public/admin bundles separated?

Design:
- Are tokens used?
- Does mobile layout work first?
- Is hierarchy clear?
- Is there one primary action?

Accessibility:
- Are labels present?
- Is focus visible?
- Are errors clear?
- Does it work without color-only meaning?

Performance:
- Are images optimized?
- Is client JS minimized?
- Are loading states stable?

Business correctness:
- Is delivery fee clear?
- Is surcharge clear?
- Is payment status honest?
- Are admin restrictions respected?

Testing:
- Are critical states tested?
- Are error states handled?
- Does build pass?
```

---

## 19. Frontend Definition of Done

A frontend feature is not done until:

```txt
1. It works on mobile first.
2. It uses design tokens.
3. It has loading, empty, success, and error states where relevant.
4. It is keyboard accessible where interactive.
5. It has clear copy.
6. It handles backend errors gracefully.
7. It does not trust frontend money calculations.
8. It works in light mode.
9. It works in dark mode.
10. It has tests for critical behavior.
11. It passes lint, typecheck, test, and build.
12. It is reviewed in Vercel Preview before production.
```

---

## 20. Critical Frontend Risks

### Risk 1: Beautiful but confusing checkout

Mitigation:

```txt
Use stepper.
Show costs clearly.
Use simple forms.
Use field-level errors.
Show payment pending honestly.
```

### Risk 2: Mobile interface too crowded

Mitigation:

```txt
One-column layout.
Compact but readable product cards.
Bottom sticky cart.
Progressive disclosure through sheets.
```

### Risk 3: Dark mode looks cheap

Mitigation:

```txt
Use dedicated dark semantic tokens.
Test product cards, checkout, invoice, and admin dashboard separately.
Avoid pure black/pure white contrast shock.
```

### Risk 4: Admin UI becomes too complex

Mitigation:

```txt
Start with operational flows.
Use filters and status badges.
Hide advanced settings behind role controls.
Avoid unnecessary charts in v1.
```

### Risk 5: AI agents introduce inconsistent UI

Mitigation:

```txt
Use AGENTS.md.
Use design tokens.
Use reusable components.
Reject random styling.
Review every generated component before merge.
```

---

## 21. Immediate Frontend Engineering Order

Follow this order strictly:

```txt
1. Frontend UI lockdown.
2. Tokens and primitives.
3. Public/app shell.
4. Homepage and menu.
5. Cart and delivery quote.
6. Checkout and payment instruction.
7. Invoice.
8. Customer auth/profile/order history.
9. Reviews.
10. Admin shell/dashboard.
11. Admin orders.
12. Admin products/media.
13. Admin delivery/payment/email/reviews.
14. Hardening and launch review.
```

This order prevents building disconnected screens before the reusable UI system exists.

---

## 22. Final Frontend Principle

Sunflour’s frontend must make the business feel easier than it is.

The customer should feel:

```txt
“This is simple. I trust this. I know what to do next.”
```

The admin should feel:

```txt
“I can see what is happening. I can process orders. I can control the menu. I am not confused.”
```

The codebase should feel:

```txt
“This is structured. This is reusable. This can grow.”
```

**Built for honour and for excellence.**

---

## 23. Reference Links

```txt
Apple Human Interface Guidelines:
https://developer.apple.com/design/human-interface-guidelines

Apple Dark Mode:
https://developer.apple.com/design/human-interface-guidelines/dark-mode

Apple Accessibility:
https://developer.apple.com/design/human-interface-guidelines/accessibility

Material Design 3:
https://m3.material.io/

Material 3 Color Roles:
https://m3.material.io/styles/color/roles

WCAG 2.2:
https://www.w3.org/TR/WCAG22/

WCAG Quick Reference:
https://www.w3.org/WAI/WCAG22/quickref/

GOV.UK Design System:
https://design-system.service.gov.uk/

GOV.UK Validation Pattern:
https://design-system.service.gov.uk/patterns/validation/

Shopify Polaris:
https://polaris-react.shopify.com/

Stripe Checkout:
https://stripe.com/payments/checkout

Stripe Checkout Best Practices:
https://stripe.com/gb/resources/more/checkout-screen-best-practices

Vercel Next.js Commerce:
https://vercel.com/templates/next.js/nextjs-commerce

Next.js on Vercel:
https://vercel.com/docs/frameworks/full-stack/nextjs

Vercel for GitHub:
https://vercel.com/docs/git/vercel-for-github

Vercel Environment Variables:
https://vercel.com/docs/environment-variables

Core Web Vitals:
https://web.dev/articles/vitals

Next.js Image Component:
https://nextjs.org/docs/app/api-reference/components/image
```
