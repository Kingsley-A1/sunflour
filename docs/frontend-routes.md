# Frontend Routes - Sunflour Bakery

Status: Phase 0 frontend route map. This file converts `frontend-implimentation.md` into route contracts for the Next.js App Router implementation.

## Source Of Truth

Read these files before adding or changing routes:

```txt
AGENTS.md
frontend-implimentation.md
backend-implementation.md
docs/design-system.md
docs/component-contracts.md
docs/api-contracts.md
```

Routes must support the product mission without inventing backend fields or business rules. If a route needs data that has no API contract yet, update `docs/api-contracts.md` first.

## Route Architecture

Use Next.js App Router route groups to keep public, customer, and admin surfaces separate.

```txt
src/
  app/
    (public)/
    (customer)/
    (admin)/
    api/
```

Public routes serve storefront and checkout. Customer routes improve returning-user convenience without blocking guests. Admin routes serve operations and must assume server-side RBAC from the backend.

## Planned Folder Structure

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
        [orderNumber]/
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
        audit-logs/
          page.tsx
    api/
      v1/
        public/
        customer/
        admin/
        webhooks/
```

Note: `frontend-implimentation.md` lists `/account/orders/[orderNumber]` and `/admin/audit-logs`; this route map includes those folders so the implementation matches the declared route list.

## Public Routes

| Route | Purpose | Primary users | Rendering | Primary components |
| --- | --- | --- | --- | --- |
| `/` | Homepage | Guests, returning customers | Server Component first | public shell, featured categories, popular items, review preview |
| `/menu` | Menu catalog | Guests, returning customers | Server-rendered initial data with client search/filter | SearchBar, CategoryPills, ProductGrid, ProductCard |
| `/products/[slug]` | Product detail page when page route is used | Buyers comparing variants | Server Component for initial detail, client add-to-cart | ProductDetailSheet or detail view, VariantSelector, AddToCartButton |
| `/cart` | Cart and delivery quote | Buyers preparing checkout | Client cart with server delivery quote call | CartItemRow, QuantityStepper, DeliveryZoneSelector, DeliveryQuoteSummary |
| `/checkout` | Guest/auth checkout | Buyers placing orders | Client form with API submission | CheckoutStepper, OrderSummaryCard, PaymentInstructionCard |
| `/orders/[orderNumber]/invoice` | Invoice view/download/print | Buyers after checkout | Server Component | InvoiceCard, WhatsAppProofButton |
| `/reviews` | Public reviews and submission | Customers and prospects | Server list with client form | ReviewCard, ReviewForm |

### `/`

Goal: make Sunflour feel fresh, trusted, local, and easy to order from.

Build:

- Hero with warm bakery message.
- `View Menu` as the primary CTA.
- WhatsApp as secondary CTA.
- Featured categories.
- Popular items.
- Delivery/payment clarity block.
- Reviews preview.
- Location, contact, and socials.

Acceptance:

- [ ] User understands what Sunflour sells within 5 seconds.
- [ ] Primary action is obvious.
- [ ] Page works at 360px mobile width.
- [ ] Images do not cause layout shift.
- [ ] Public page stays mostly server-rendered.

### `/menu`

Goal: help users find products quickly.

Build:

- Search.
- Category pills.
- Product grid/list.
- Availability badges.
- Product detail sheet or page transition.
- Add to cart.
- WhatsApp enquiry.
- Empty state.
- Loading skeleton.

Acceptance:

- [ ] Menu loads fast.
- [ ] Search/filter interaction does not feel heavy.
- [ ] Out-of-stock products cannot be ordered.
- [ ] Product cards remain readable and consistent.
- [ ] Initial data comes from public API contract.

### `/products/[slug]`

Goal: show product details, variants, availability, imagery, and order actions clearly.

Build:

- Product name, description, image, status, and price display.
- Variant selector where variants exist.
- Quantity selection.
- Add-to-cart action.
- WhatsApp enquiry fallback.
- Out-of-stock or hidden handling.

Acceptance:

- [ ] Hidden products do not appear publicly.
- [ ] Out-of-stock state is visible and cannot be ordered.
- [ ] Variant price display does not become a trusted checkout value.
- [ ] Image has stable dimensions and useful alt text.

### `/cart`

Goal: make order review and delivery quote simple.

Build:

- Cart item list.
- Quantity controls.
- Delivery/pickup selector.
- Delivery zone selector.
- Delivery quote summary.
- Subtotal, delivery base fee, surcharge if applicable, and total.
- Continue to checkout.

Acceptance:

- [ ] User sees delivery fee before checkout.
- [ ] 6 PM surcharge is visible when applied by backend quote.
- [ ] Cart updates feel immediate.
- [ ] Totals are display-only and not trusted by checkout.
- [ ] Empty cart state gives a clear path back to menu.

### `/checkout`

Goal: convert without confusion.

Checkout steps:

```txt
Step 1: Customer details.
Step 2: Delivery/pickup details.
Step 3: Review order.
Step 4: Create order.
Step 5: Payment instruction + invoice + WhatsApp proof.
```

Acceptance:

- [ ] User can complete checkout without email.
- [ ] Authenticated user can reuse profile data.
- [ ] Guest buyer can complete order quickly.
- [ ] Errors are field-specific and human.
- [ ] Serious validation failures show an error summary.
- [ ] Payment is not marked confirmed until backend/admin confirms it.
- [ ] API submission uses idempotency once backend supports it.

### `/orders/[orderNumber]/invoice`

Goal: make the order feel official and traceable.

Build:

- Invoice header with logo.
- Order number.
- Customer snapshot.
- Items.
- Delivery fee and surcharge.
- Total.
- Payment instruction.
- Download/print button.
- WhatsApp proof button.

Acceptance:

- [ ] Invoice works on mobile.
- [ ] Invoice works for print/save as PDF.
- [ ] Invoice totals match backend snapshots.
- [ ] Payment instruction uses order snapshot, not current admin settings.

### `/reviews`

Goal: collect trust signals without exposing unmoderated content.

Build:

- Approved public review list.
- Review submission form.
- Rating selector.
- Pending moderation success state.
- Empty state.

Acceptance:

- [ ] Submitted reviews enter pending state.
- [ ] Pending reviews do not appear publicly.
- [ ] User understands the review may require approval.
- [ ] Review form is rate-limit friendly and accessible.

## Customer Routes

| Route | Purpose | Auth | Rendering | Primary components |
| --- | --- | --- | --- | --- |
| `/account` | Profile overview | Customer session | Server shell with client form where needed | profile form, saved details |
| `/account/orders` | Order history | Customer session | Server Component first | order list, status pills |
| `/account/orders/[orderNumber]` | Order details | Customer session and ownership | Server Component first | order detail, timeline, invoice link |

Customer auth improves convenience but must not block guest checkout.

Acceptance:

- [ ] Guest checkout remains available.
- [ ] Authenticated customer sees only own profile and orders.
- [ ] Order detail links to invoice.
- [ ] Backend enforces ownership; UI does not pretend to be the security boundary.

## Admin Routes

| Route | Purpose | Minimum role | Primary components |
| --- | --- | --- | --- |
| `/admin` | Dashboard | MODERATOR | AdminShell, MetricCard, priority queues |
| `/admin/orders` | Order list | MODERATOR | OrderFilters, OrderTable, StatusBadge |
| `/admin/orders/[id]` | Order detail and lifecycle | MODERATOR | OrderStatusTimeline, status controls, ConfirmDialog |
| `/admin/products` | Product list | MODERATOR for availability, SUPER_ADMIN for full edits depending policy | ProductTable |
| `/admin/products/new` | Create product | SUPER_ADMIN | ProductEditorForm |
| `/admin/products/[id]` | Edit product | SUPER_ADMIN, limited moderator availability controls if approved | ProductEditorForm |
| `/admin/categories` | Category manager | SUPER_ADMIN | CategoryEditorForm |
| `/admin/delivery` | Delivery zones and 6 PM surcharge | SUPER_ADMIN for rule changes | DeliveryZoneTable, SurchargeRuleForm |
| `/admin/reviews` | Review moderation | MODERATOR | ReviewModerationList |
| `/admin/settings/payment` | Moniepoint/payment settings | SUPER_ADMIN | PaymentSettingsForm |
| `/admin/settings/email` | Email settings/templates | SUPER_ADMIN | EmailTemplateList |
| `/admin/audit-logs` | Audit log review | SUPER_ADMIN | AuditLogTable |

### `/admin`

Goal: give staff an operational control room.

Dashboard data:

- Today's orders.
- Pending payment confirmation.
- Preparing orders.
- Total users.
- Number of guests.
- Cancelled orders.
- Out for delivery.
- Delivered orders.
- Total sales estimate.
- Top ordered items.
- Low/hidden/out-of-stock products.
- Recent reviews pending approval.

Acceptance:

- [ ] Dashboard works on mobile and desktop.
- [ ] Critical statuses are visible above the fold.
- [ ] No sensitive payment settings are exposed to moderator.
- [ ] Metrics come from backend endpoint, not frontend guesses.

### `/admin/orders` and `/admin/orders/[id]`

Goal: let staff move orders through the lifecycle safely.

Build:

- Status tabs/filters.
- Search by order number or customer phone.
- Order list with status badges.
- Order detail page.
- Payment status controls.
- Fulfillment status controls.
- Timeline of order status events.
- Admin notes.
- Confirmation dialogs for cancellation/rejection.

Acceptance:

- [ ] Moderator can process orders without seeing unnecessary settings.
- [ ] Invalid status transitions are not available in UI.
- [ ] UI still handles backend transition rejection gracefully.
- [ ] Payment confirmation UI does not bypass backend audit behavior.

### `/admin/products`, `/admin/products/new`, `/admin/products/[id]`, `/admin/categories`

Goal: make menu updates safe and fast.

Build:

- Product table.
- Category filter.
- Status filter.
- Product editor.
- Variant editor.
- Image upload through backend signed upload flow.
- Availability toggle.
- Hidden/out-of-stock controls.

Acceptance:

- [ ] Admin can update menu without code.
- [ ] Product image upload has preview, progress, and error handling.
- [ ] Product price changes do not imply old invoice changes.
- [ ] Public menu reflects only backend-approved visibility.

### `/admin/delivery`

Goal: make delivery pricing clear and editable.

Build:

- Delivery-zone list.
- Add/edit zone form.
- Active/inactive toggle.
- 6 PM surcharge rule form.
- Preview fee calculation helper.

Acceptance:

- [ ] Admin understands that 6 PM surcharge adds NGN 500.
- [ ] UI separates base fee from surcharge.
- [ ] Moderator access depends on backend permission.
- [ ] Checkout cannot manipulate delivery fee from frontend.

### `/admin/reviews`

Goal: protect the public brand while collecting trust signals.

Build:

- Pending review queue.
- Approved/rejected/hidden filters.
- Approve/reject/hide actions.
- Rating and customer/order context.

Acceptance:

- [ ] Pending reviews never appear publicly until approved.
- [ ] Admin moderation action gives clear feedback.
- [ ] Moderation writes audit logs through backend.

### `/admin/settings/payment` and `/admin/settings/email`

Goal: control sensitive business settings without exposing them casually.

Acceptance:

- [ ] Moderator cannot access sensitive settings.
- [ ] Super admin changes show confirmation and audit-context UI.
- [ ] Payment settings are not exposed outside allowed admin routes.
- [ ] Email settings remain transactional only unless business approves marketing later.

## Route-Level Data Strategy

Use Server Components for:

- Homepage content.
- Initial menu fetch.
- Product detail page.
- Invoice page.
- Admin dashboard shell where possible.

Use Client Components for:

- Search/filter interactions.
- Cart state.
- Checkout form.
- Product detail sheets.
- Admin table filters.
- Upload progress.
- Status update actions.

API client rules:

- [ ] All API calls use typed wrappers.
- [ ] No raw `fetch` scattered through components.
- [ ] API errors return normalized UI-friendly messages.
- [ ] Money values display through shared money formatter.
- [ ] Dates display through shared date formatter.

## Loading, Empty, Error, And Not Found

Every meaningful route needs stable state handling.

Required:

- [ ] `loading.tsx` for `/menu`, `/checkout`, and admin-heavy routes once implemented.
- [ ] `error.tsx` for route groups where backend errors are likely.
- [ ] `not-found.tsx` for invalid product slug, invoice, and admin detail records.
- [ ] Empty states for menu search, cart, order history, admin lists, reviews, and dashboard blocks.
- [ ] Error states explain what the user can do next.

## Navigation Rules

- Public navigation should prioritize menu, cart, checkout state, and contact.
- Mobile navigation should be touch-friendly and predictable.
- Admin navigation should group orders, catalog, delivery, reviews, and settings.
- Restricted admin links should be hidden when appropriate, but backend remains the authority.
- Route titles should make location obvious.

## Route Review Checklist

- [ ] Route belongs to the right route group.
- [ ] Route has clear user purpose.
- [ ] Route reads backend contract before implementation.
- [ ] Route does not invent product rules.
- [ ] Route has loading, error, and empty states where relevant.
- [ ] Route works on 360px mobile width.
- [ ] Route supports keyboard navigation.
- [ ] Route uses design tokens and component contracts.
- [ ] Route does not trust frontend totals.
- [ ] Route keeps public and admin bundles separated.
