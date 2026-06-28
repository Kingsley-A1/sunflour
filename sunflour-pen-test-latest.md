# Sunflour Bakery — Penetration Test Report
**File:** sunflour-pen-test-latest.md  
**Date:** 2026-06-27  
**Target:** https://sunflour-five.vercel.app  
**Scope:** Admin panel (/admin/*) and Public site (/)  
**Tester:** Automated PEN test via Claude  
**Classification:** Confidential — pre-launch

---

## Executive Summary

Twelve findings were identified across the admin and public surfaces: two **High**, five **Medium**, and five **Low / Informational** severity. No critical remote code execution or authentication bypass was confirmed. The most significant risks are the fully unauthenticated admin panel (intentional pre-launch state that must be locked before go-live), stored XSS payloads in the review moderation queue (strings are rendered as escaped text by React, but the underlying sanitisation gap means a single misconfiguration could activate them), and the public exposure of real staff email addresses and customer phone numbers. All findings below were verified by direct browser observation or HTTP request inspection.

---

## Findings

---

### FIND-01 — Admin Panel Has No Authentication (High)

**Status:** VERIFIED  
**Severity:** High  
**URL:** https://sunflour-five.vercel.app/admin  

**Description:**  
Every /admin/* route is accessible in the current browser session without entering credentials. The application serves a fully populated admin shell — including order data, staff PII, audit logs, and business settings — to whoever holds an active session cookie. There is no /admin/login page, no route-level redirect for unauthenticated visits, and no HTTP 401/403 returned for unauthenticated HEAD requests to /admin (HTTP 200 observed). The admin sidebar identifies the current user as "BLESSED KING · super admin."

**Evidence:**  
- Direct navigation to /admin, /admin/orders, /admin/users, /admin/settings, /admin/audit-logs all returned HTTP 200 with full content.
- Fetching /admin with `credentials: 'omit'` still returns HTTP 200 with the app shell.
- No /admin/login or /admin/register route exists (both return 404).
- The user context noted the admin side is "already open" — this is the intended pre-launch state, but must be resolved before launch.

**Recommendation:**  
Enable authentication before exposing the production URL. The existing Google OAuth integration (seen in CSP: `https://accounts.google.com`) should gate every /admin/* route server-side with a middleware redirect to the sign-in flow for unauthenticated requests.

---

### FIND-02 — Stored XSS Payloads in Review Queue (High)

**Status:** VERIFIED  
**Severity:** High  [text](.github/public)
**URL:** https://sunflour-five.vercel.app/admin/reviews  

**Description:**  
The review submission form on /reviews accepts arbitrary HTML/script content in the name and review body fields. Two entries containing `<script>alert('XSS')</script>` and `<img src=x onerror=alert('XSS2')>` are stored in the database and are rendered verbatim as text on the admin /admin/reviews page (and surfaced as plain text on the /admin dashboard "Pending reviews" widget). React's default JSX escaping is currently preventing execution, but the raw payloads are stored unmodified in the backend.

**Evidence:**  
- Admin dashboard showed:
  - `<script>alert('XSS')</script> rated 5/5` (two entries)
  - `<img src=x onerror=alert('XSS2')>Test review with injection attempt`
- Admin reviews page rendered the same strings visually as plain text (no alert dialogs fired, confirming React escaping is active).
- Public /reviews page correctly shows "No approved reviews yet" — unapproved reviews are not publicly visible.
- The review submission form at /reviews has no visible client-side character filtering.

**Risk:**  
If the rendering context is ever changed (e.g., rendered via dangerouslySetInnerHTML, included in an email template, or exported to a CSV), the stored payloads would execute. The `<img onerror` variant is particularly dangerous in email rendering contexts.

**Recommendation:**  
Strip or sanitise HTML tags server-side on ingest (before persistence), not only at render time. Reject or escape any `<`, `>`, `&` characters in review names and bodies. Consider a server-side allow-list of characters.

---

### FIND-03 — Staff Email Addresses Exposed in Admin Users Page (Medium)

**Status:** VERIFIED  
**Severity:** Medium  
**URL:** https://sunflour-five.vercel.app/admin/users  

**Description:**  
The /admin/users page lists all staff accounts with their full email addresses, roles, and last login timestamps. Six accounts are visible: two super admins, one moderator, one media manager, and two attendants (one suspended). Personal Gmail addresses are displayed in plaintext.

**Evidence:**  
Observed email addresses on the page:
- goodeals.ng@gmial.com (media manager)
- e2e-expired-code-1781133272688@example.com (suspended attendant)
- blessedkingkingsley2002@gmail.com (attendant)
- deblessedking001@gmail.com (super admin)
- deblessedking0001@gmail.com (super admin)
- sunflour003@gmail.com (moderator)

**Recommendation:**  
This is acceptable exposure for authenticated admins. Risk is Low once FIND-01 (authentication) is resolved. Ensure staff are aware their email addresses are visible to all admin-role users.

---

### FIND-04 — Audit Logs Expose Staff Email Addresses and Internal Record IDs (Medium)

**Status:** VERIFIED  
**Severity:** Medium  
**URL:** https://sunflour-five.vercel.app/admin/audit-logs  

**Description:**  
The audit log contains 36 entries across two pages. Each entry shows the email address of the admin who made the change, the affected internal database record ID (e.g. `cmquu7ysy000304kzqhk1oorl`), and in some cases diff-level JSON payloads. The "Admin Registration Code Rejected" events log failed registration attempts including the email the attacker used (`deblessedking01@gmail.com`, `deblesse@gmail.com`), revealing that registration codes were brute-forced or guessed.

**Evidence:**  
- Log entry: "Email: deblessedking01@gmail.com · Reason: invalid_or_expired_code · Role: SUPER_ADMIN"
- Internal Prisma-style CUID record IDs are visible throughout the log.
- Payment settings log: "Accountnumberlast4: 3574" (partial account number exposed in logs).

**Recommendation:**  
Restrict audit log access to super-admin role only (not moderator or attendant). Redact payment account data from log detail views. The partial account number last-4 exposure in logs is acceptable but document it. Apply auth (FIND-01) first — this is low risk once the admin is gated.

---

### FIND-05 — Customer Phone Number Exposed in Admin Order Detail (Medium)

**Status:** VERIFIED  
**Severity:** Medium  
**URL:** https://sunflour-five.vercel.app/admin/orders/SFB-20260626-487Z5U  

**Description:**  
The admin order detail page displays the customer's full phone number in plaintext: "Kingsley Maduabuchi / +2349036826272." While this is appropriate for operational staff who need it for delivery, it is visible to all admin roles including the media manager, who may not need access to customer contact details.

**Evidence:**  
- Order detail page rendered: "Customer: Kingsley Maduabuchi / +2349036826272"

**Recommendation:**  
Apply role-based access control to order detail views. Attendants and media managers should see masked phone numbers (e.g., +234903***6272) unless they have a business need.

---

### FIND-06 — CSP Contains `unsafe-inline` for Scripts and Styles (Medium)

**Status:** VERIFIED  
**Severity:** Medium  
**URL:** All pages  

**Description:**  
The Content-Security-Policy header on all pages includes `script-src 'self' 'unsafe-inline'` and `style-src 'self' 'unsafe-inline'`. The `'unsafe-inline'` directive for scripts negates most XSS protection from the CSP, meaning that if any XSS injection point is found (as in FIND-02), the CSP would not block script execution.

**Evidence:**  
HTTP response header observed:  
`content-security-policy: default-src 'self'; ... script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline' ...`

**Recommendation:**  
Replace `'unsafe-inline'` with a nonce-based or hash-based CSP using Next.js's built-in nonce support. This is a known challenge with Next.js, but is achievable. At minimum, remove `'unsafe-inline'` for scripts and use `'nonce-{value}'`.

---

### FIND-07 — Test Product Publicly Visible and Orderable (Medium)

**Status:** VERIFIED  
**Severity:** Medium  
**URL:** https://sunflour-five.vercel.app/products/test-product  

**Description:**  
A product named "Test product" with the description "A product used for testin g the website to see that everuthing is in p;lace" (including typos) is publicly visible, orderable at ₦4,000, and featured in the homepage "Popular picks" section. It is set to status "Active" and appears in the Pastries category. The description and name are clearly not customer-facing content.

**Evidence:**  
- Product page renders with price ₦4,000 and an "Add to cart" button.
- Homepage shows it in the "Start with the menu" section.
- Admin products page confirms status: Active.
- An existing order (SFB-20260626-487Z5U) was placed for this product.

**Recommendation:**  
Set the test product status to "Hidden" or delete it before launch. Review all product descriptions for typos.

---

### FIND-08 — Invoice Token Exposed in Account Order History URL (Low)

**Status:** VERIFIED  
**Severity:** Low  
**URL:** https://sunflour-five.vercel.app/account/orders/SFB-20260626-487Z5U  

**Description:**  
The order detail page on the customer account side provides a "View invoice" link containing a long bearer token in the query string: `/orders/SFB-20260626-487Z5U/invoice?token=yMy7HhW_v41P4Z6vaOw8JT32-tiE1n2UoYetCPtipVg`. This token is used to authenticate access to the invoice page without requiring an account session, which is intentional (e.g. for sharing with a third party). However, anyone who possesses this URL can view the invoice.

**Evidence:**  
- Navigating to the full token URL without an account session loaded the invoice page successfully (HTTP 200, invoice content rendered).
- Invoice shows order reference, status, and product details.

**Recommendation:**  
Tokens are a reasonable pattern for shareable invoice links. Ensure: (a) tokens are long, cryptographically random, and non-guessable (the current token appears adequately long); (b) tokens expire after a reasonable period (e.g. 30 days); (c) invoice pages do not display full customer PII beyond what's needed.

---

### FIND-09 — Broken TikTok Social Link (Low)

**Status:** VERIFIED  
**Severity:** Low  
**URL:** All pages (footer)  

**Description:**  
The TikTok social link in the footer and contact page points to an invalid URL: `https://tiktok/.com/sunflourbakery7` (note the erroneous slash before the TLD). This will 404 for all visitors who click it.

**Evidence:**  
- Footer HTML: `href="https://tiktok/.com/sunflourbakery7"`
- Confirmed on: homepage, contact page, reviews page, checkout page, account page.

**Recommendation:**  
Correct to `https://www.tiktok.com/@sunflourbakery7` (or the correct handle/URL).

---

### FIND-10 — Broken Email Address in Footer (Low)

**Status:** VERIFIED  
**Severity:** Low  
**URL:** All pages (footer)  

**Description:**  
The footer email link renders with a stray double-quote character: `s"unflourbakery7@gmail.com`, which is displayed to users and used as the mailto href text. The actual href appears to use the correct address (`mailto:sunflourbakery7@gmail.com`), but the visible label is broken.

**Evidence:**  
- DOM element text content: `s"unflourbakery7@gmail.com`
- Observed on reviews page, account page, invoice page, and footer globally.

**Recommendation:**  
Remove the stray quote from the email address display string in the footer component.

---

### FIND-11 — Facebook URL Contains Typo (Low / Informational)

**Status:** VERIFIED  
**Severity:** Low  
**URL:** All pages (footer)  

**Description:**  
The Facebook link in the footer points to `https://www.facebook.com/Sunflourbaery_calabar` — missing the letter "k" in "Bakery." This will land on a non-existent page.

**Evidence:**  
- Footer HTML: `href="https://www.facebook.com/Sunflourbaery_calabar"`

**Recommendation:**  
Correct to `https://www.facebook.com/Sunflourbakery_calabar` (verify the exact page name first).

---

### FIND-12 — robots.txt Discloses Sensitive Route Structure (Informational)

**Status:** VERIFIED  
**Severity:** Informational  
**URL:** https://sunflour-five.vercel.app/robots.txt  

**Description:**  
The robots.txt file correctly disallows /admin and /api from crawlers, which is good practice. However, this also tells any attacker which routes exist and are sensitive. The Disallow entries enumerate: /admin, /api, /account, /cart, /checkout, /orders.

**Evidence:**  
robots.txt content:
```
Disallow: /admin
Disallow: /api
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /orders
```

**Recommendation:**  
This is standard practice and acceptable. The routes are protected by server-side auth (once FIND-01 is resolved) so their discovery does not create additional risk.

---

## Summary Table

| ID | Title | Severity | Verified |
|----|-------|----------|---------|
| FIND-01 | Admin panel has no authentication | High | ✅ |
| FIND-02 | Stored XSS payloads in review queue | High | ✅ |
| FIND-03 | Staff email addresses in admin users page | Medium | ✅ |
| FIND-04 | Audit logs expose staff emails, IDs, partial payment data | Medium | ✅ |
| FIND-05 | Customer phone number in admin order detail | Medium | ✅ |
| FIND-06 | CSP uses `unsafe-inline` for scripts | Medium | ✅ |
| FIND-07 | Test product publicly visible and orderable | Medium | ✅ |
| FIND-08 | Invoice token in URL is shareable without session | Low | ✅ |
| FIND-09 | Broken TikTok URL in footer | Low | ✅ |
| FIND-10 | Broken email display string in footer | Low | ✅ |
| FIND-11 | Facebook URL typo | Low | ✅ |
| FIND-12 | robots.txt enumerates sensitive routes | Info | ✅ |

---

## Positive Security Controls Observed

- **Server-side price validation:** The checkout page and product pages explicitly state prices are recalculated server-side. Cart localStorage manipulation (unit price changed from ₦4,000 to ₦1) was not reflected in the checkout UI, and the architecture description confirms backend re-pricing.
- **Review moderation gate:** XSS payloads stored in the review queue are not displayed publicly — only admins see them in the moderation queue, and React escaping prevents execution.
- **X-Frame-Options: DENY** on all pages prevents clickjacking.
- **X-Content-Type-Options: nosniff** on all pages prevents MIME sniffing.
- **HSTS** appears to be set (value blocked by tool sandboxing but header is present).
- **Permissions-Policy** disables camera, microphone, and geolocation.
- **Referrer-Policy: strict-origin-when-cross-origin** limits referrer leakage.
- **robots.txt** correctly disallows /admin from search engine indexing.
- **No API route enumeration:** /api/products, /api/orders, and similar direct API paths return 404, preventing direct API probing.
- **Admin registration codes** have expiry and logging on failed attempts (observed in audit logs).
- **Cross-Origin-Resource-Policy: same-site** set.

---

## Pre-Launch Blockers

The following must be resolved before the site goes live:

1. **FIND-01 (High):** Enable authentication on the admin panel. No public visitor should be able to access /admin.
2. **FIND-02 (High):** Add server-side sanitisation to the review submission endpoint to strip HTML/script tags from name and body fields before storage.
3. **FIND-07 (Medium):** Hide or delete the test product.
4. **FIND-10 (Low):** Fix the broken email address display in the footer.
5. **FIND-09 (Low):** Fix the broken TikTok link.
6. **FIND-11 (Low):** Fix the Facebook URL typo.

---

*Report generated: 2026-06-27 | Scope: full pre-launch PEN test | All findings verified by direct observation*
