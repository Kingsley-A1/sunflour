# Component Contracts - Sunflour Bakery

Status: Phase 0 frontend component contract document. This file turns `frontend-implimentation.md` into implementation boundaries for primitives, commerce components, admin components, forms, state, accessibility, and tests.

## Source Of Truth

Read these files before creating or changing components:

```txt
AGENTS.md
frontend-implimentation.md
docs/design-system.md
docs/frontend-routes.md
docs/api-contracts.md
```

Components must support the route contracts and design system. They must not own backend business rules.

## Component Layering

```txt
1. Primitives
2. Form components
3. Commerce components
4. Admin components
5. Route sections
```

The lower a component sits in this stack, the less product-specific behavior it should know. `Button` should not know about checkout. `PaymentInstructionCard` can know payment copy, but it still cannot confirm payment by itself. Route sections compose components and pass server/API data down as typed props.

## Global Rules

- Components accept typed props.
- Components consume canonical semantic tokens from `@sunflour/design-tokens`; raw primitives and deprecated compatibility aliases are forbidden in application code.
- Components do not fetch data unless they are route-level Server Components or deliberately isolated data components.
- Components do not hardcode backend business rules.
- Components do not calculate trusted totals.
- Components do not create random colors outside tokens.
- Interactive components define focus, loading, disabled, and error states.
- Public components stay light and avoid admin-only dependencies.
- Admin components can be denser but must remain accessible.

## Shared Prop Conventions

Use predictable prop names across components.

```ts
type AsyncState = "idle" | "loading" | "success" | "error";

type ComponentSize = "sm" | "md" | "lg";
type ComponentTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

type CommonInteractiveProps = {
  disabled?: boolean;
  loading?: boolean;
  "aria-label"?: string;
};
```

Do not pass raw database records directly to UI primitives. Business components can accept domain DTOs from `src/types/domain.ts` once defined.

## Primitive Contracts

| Component | Purpose | Required states | Accessibility contract | Notes |
| --- | --- | --- | --- | --- |
| `Button` | Primary, secondary, tertiary, danger actions | default, hover, focus, pressed, disabled, loading | native `button`, accessible name, visible focus | Use icons where a familiar symbol exists. |
| `IconButton` | Compact icon-only action | default, hover, focus, pressed, disabled, loading | requires `aria-label`, tooltip for unfamiliar icons | Use lucide icons once dependency is approved/available. |
| `Input` | Single-line text entry | default, focus, disabled, error | associated label, described-by error/help text | Use correct input type. |
| `Textarea` | Multi-line text entry | default, focus, disabled, error | associated label, described-by error/help text | Used for notes/reviews. |
| `Select` | Native select or accessible custom select | default, focus, disabled, error | label, keyboard usable | Prefer native until a custom widget is justified. |
| `Checkbox` | Binary form value | default, checked, focus, disabled, error | label must be clickable | Use for confirmations/preferences. |
| `RadioGroup` | Mutually exclusive choices | default, selected, focus, disabled, error | fieldset/legend or ARIA group | Use for delivery/pickup. |
| `Switch` | Immediate on/off setting | default, checked, focus, disabled, loading | accessible checked state | Use carefully for admin settings. |
| `Badge` | Short status/category label | neutral, success, warning, danger, info | not color-only when status matters | Pair with text meaning. |
| `Card` | Repeated grouped item | default, interactive if needed, selected if needed | semantic container or link/button when interactive | Do not nest cards inside cards. |
| `Sheet` | Mobile-first side/bottom surface | opening, open, closing, error | focus trap, labelled title, dismiss behavior | Good for product detail and filters. |
| `Dialog` | Modal confirmation or focused task | opening, open, closing, error | focus trap, labelled title, escape behavior | Use for risky admin actions. |
| `Drawer` | Larger persistent panel | open, closed | focus management | Use only when sheet/dialog is not enough. |
| `Tabs` | View filtering or mode switching | selected, focus, disabled | keyboard arrow support | Useful for admin order status filters. |
| `Toast` | Short feedback | success, error, info | does not replace field errors | Use for confirmations, not critical-only errors. |
| `Skeleton` | Stable loading placeholder | loading only | hidden or labelled appropriately | Prevent layout shift. |
| `Separator` | Visual grouping | static | decorative unless semantic sectioning needed | Keep subtle. |
| `Avatar` | User/admin identity | image, initials, fallback | image alt or decorative depending context | Use in admin/profile only if useful. |
| `EmptyState` | No data or no result | static/actionable | clear message and next action | Not a decorative blank panel. |
| `ErrorState` | Route/block failure | recoverable/unrecoverable | tells user what to do next | Include retry action where possible. |
| `LoadingState` | Full or block loading | loading only | preserve context | Do not hide critical route context. |
| `ConfirmDialog` | Guard destructive or critical actions | open, confirming, error | labelled dialog, keyboard usable | Required for cancel/reject/delete-like actions. |

## Primitive Acceptance Checklist

- [ ] Uses semantic tokens.
- [ ] Works in light mode.
- [ ] Works in dark mode.
- [ ] Has visible focus state.
- [ ] Has disabled state.
- [ ] Has loading state if async.
- [ ] Has error state if form-related.
- [ ] Meets mobile touch target expectations.
- [ ] Text cannot overflow in normal usage.
- [ ] Component test covers core states.

## Commerce Component Contracts

| Component | Responsibility | Must receive | Must not do |
| --- | --- | --- | --- |
| `CategoryPills` | Filter menu by category | categories, active category, change handler | Fetch products directly unless route-scoped. |
| `ProductCard` | Show product summary and orderability | product DTO, status, image, price display, action handlers | Trust price for checkout. |
| `ProductGrid` | Lay out menu products | product list, view state, empty/loading state | Own search/filter business rules. |
| `ProductDetailSheet` | Show product details and add-to-cart UI | product detail DTO, variants, availability | Confirm backend orderability. |
| `VariantSelector` | Choose one variant | variants, selected variant, change handler | Recalculate trusted final price. |
| `QuantityStepper` | Change item quantity | value, min, max, change handler | Allow invalid quantities. |
| `AddToCartButton` | Add selected product to cart | selected product/variant/quantity, disabled reason | Order hidden/out-of-stock products. |
| `StickyCartBar` | Persistent cart action on mobile | item count, display total/estimate, CTA | Claim final total authority. |
| `CartItemRow` | Show cart line and quantity controls | item snapshot from cart state | Mutate backend order directly. |
| `DeliveryZoneSelector` | Choose active delivery zone | delivery zones, selected zone, method | Show inactive zones as orderable. |
| `DeliveryQuoteSummary` | Display backend quote | base fee, surcharge, total fee, quote status | Compute final checkout delivery fee. |
| `CheckoutStepper` | Guide checkout steps | current step, step validity, navigation handlers | Hide required validation errors. |
| `OrderSummaryCard` | Show order review | cart items, quote, backend checkout result when available | Treat frontend subtotal as final. |
| `PaymentInstructionCard` | Show manual payment details | order number, amount, payment instruction snapshot, status | Say payment is confirmed before backend/admin confirmation. |
| `InvoiceCard` | Show invoice data | invoice snapshot DTO | Recalculate invoice from current product/admin settings. |
| `WhatsAppProofButton` | Open proof handoff | WhatsApp proof URL/message, order number | Mark payment as confirmed. |
| `ReviewForm` | Submit review | form schema/defaults, submit handler | Publish review directly. |
| `ReviewCard` | Show approved review | approved review DTO | Render pending/rejected reviews publicly. |

## Commerce Acceptance Checklist

- [ ] Product images use stable aspect ratio.
- [ ] Product cards remain readable on 360px mobile width.
- [ ] Out-of-stock state blocks ordering.
- [ ] Delivery base fee and surcharge are visually separate.
- [ ] Checkout errors are field-specific and human.
- [ ] Payment status copy is honest.
- [ ] Invoice uses backend snapshots.
- [ ] Review submission explains moderation.

## Admin Component Contracts

| Component | Responsibility | Required behavior |
| --- | --- | --- |
| `AdminShell` | Admin layout, navigation, content frame | separates admin from public shell, supports mobile/tablet/desktop. |
| `AdminSidebar` | Admin navigation | hides or marks restricted links based on role data, backend remains authority. |
| `AdminTopbar` | Admin context/actions | shows page title, account context, optional theme toggle. |
| `MetricCard` | Dashboard metric | shows label, value, loading, empty/error state, and optional trend/context. |
| `StatusBadge` | Order/payment/product/review status | uses text plus color/tone, never color alone. |
| `OrderStatusTimeline` | Order history | shows status events in chronological order. |
| `OrderTable` | Admin order list | supports status, payment, customer, created date, row action. |
| `OrderFilters` | Order tabs/search | filters by status and order number/phone. |
| `ProductTable` | Catalog operations | filters by category/status, shows availability clearly. |
| `ProductEditorForm` | Product create/edit | validates name, category, price, status, variants, images. |
| `CategoryEditorForm` | Category create/edit | validates name, slug, active state, sort order. |
| `DeliveryZoneTable` | Delivery-zone management | separates base fee from active state. |
| `SurchargeRuleForm` | 6 PM surcharge rule | shows NGN 500 rule clearly and validates time/amount. |
| `PaymentSettingsForm` | Moniepoint settings | super_admin-only UI, confirmation, audit-context copy. |
| `EmailTemplateList` | Email template/settings control | transactional only, no marketing automation. |
| `ReviewModerationList` | Pending/approved/rejected/hidden reviews | approve/reject/hide actions with clear feedback. |
| `AuditLogTable` | Critical action history | super_admin-focused, filterable later. |

## Admin Acceptance Checklist

- [ ] Moderator does not see unnecessary sensitive settings.
- [ ] Super admin-only pages have restricted-state handling.
- [ ] Invalid order transitions are not offered in UI.
- [ ] Backend rejection is handled gracefully.
- [ ] Destructive actions use `ConfirmDialog`.
- [ ] Tables are keyboard usable.
- [ ] Audit-sensitive changes show confirmation and context.

## Form Contract

Use React Hook Form with Zod resolver when the app foundation exists. Backend validation remains mandatory.

Every form component must define:

- Form title.
- Field labels.
- Help text where needed.
- Field-level error messages.
- Submit loading state.
- Submit error state.
- Success/confirmation state.
- Accessible error summary for serious checkout/admin forms.

Forms must not submit hidden trusted values such as final price, delivery total, surcharge, or payment confirmation.

## Status Contract

Status components must map domain statuses to text, tone, and optional helper copy. The text is mandatory because color alone is not accessible.

Required status families:

```txt
OrderStatus:
PENDING_PAYMENT
PAYMENT_UNDER_REVIEW
PAYMENT_CONFIRMED
PREPARING
READY_FOR_PICKUP
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
REJECTED

PaymentStatus:
UNPAID
PROOF_SENT_ON_WHATSAPP
UNDER_REVIEW
CONFIRMED
REJECTED

ProductStatus:
ACTIVE
HIDDEN
OUT_OF_STOCK

ReviewStatus:
PENDING
APPROVED
REJECTED
HIDDEN
```

The mapping should live in a shared utility, not inside every badge instance.

## Data And Fetching Contract

Route-level components fetch data. Reusable components receive typed data.

Allowed:

- Server Components fetching initial page data.
- Client Components managing local interactions.
- Typed API wrappers in `src/lib/api/*`.
- Shared formatters in `src/lib/money/*` and `src/lib/dates/*`.

Rejected:

- Raw `fetch` scattered through cards/forms/tables.
- Components calculating trusted totals.
- Components hardcoding delivery zones, product prices, or payment settings.
- UI-only authorization for admin-sensitive actions.

## File Placement

```txt
src/
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
    money/
    dates/
    validation/
    accessibility/
  types/
    api.ts
    domain.ts
```

Use `components/*` for reusable UI and `features/*` for route-specific compositions.

## Testing Contract

Design-system migration checks live in `tests/design-system/vertical-slices.spec.ts`. Each maintained vertical slice pairs a stable screenshot baseline with an axe scan for critical and serious WCAG violations. Authenticated account and admin interiors require test credentials; their public access boundaries remain the default baseline.

Unit tests:

- Money formatting.
- Delivery quote display logic.
- Status badge mapping.
- Theme token utilities.
- API error normalization.

Component tests:

- `ProductCard`.
- `ProductDetailSheet`.
- `CartItemRow`.
- `CheckoutStepper`.
- `PaymentInstructionCard`.
- `InvoiceCard`.
- `MetricCard`.
- `OrderStatusTimeline`.
- `ProductEditorForm`.

E2E tests:

- Guest menu -> cart -> checkout -> invoice -> WhatsApp proof link.
- Authenticated checkout with saved details.
- Product out-of-stock cannot be ordered.
- Admin logs in and views dashboard.
- Admin confirms payment.
- Admin moves order to preparing/out for delivery/delivered.
- Admin edits delivery zone.
- Review submission enters pending state.

Visual/accessibility checks:

- Light mode product grid.
- Dark mode product grid.
- Checkout mobile.
- Invoice print view.
- Admin dashboard desktop.
- Admin orders mobile/tablet.
- axe scan for checkout/admin forms.

## Component Review Checklist

- [ ] Component has a clear layer: primitive, form, commerce, admin, or route section.
- [ ] Props are typed and minimal.
- [ ] Uses design tokens only.
- [ ] Has required interaction states.
- [ ] Has accessible name/label where interactive.
- [ ] Works in light and dark mode.
- [ ] Works on mobile first.
- [ ] Does not fetch data unless route-level or explicitly isolated.
- [ ] Does not own trusted business calculations.
- [ ] Handles empty/error/loading state where relevant.
- [ ] Has focused tests if behavior is meaningful.
