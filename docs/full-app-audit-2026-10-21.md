# UK Recovery full-app audit — 2026-10-21
Scope: GitHub main at 45108b277cf3453074ff023bdb6aeed6e9924e98. Static repository review and prior GitHub CI evidence; no authorized Production DB, Vercel environment, staging accounts or live browser session used. Status below is deliberately not a claim of live verification.

## Frontend screens (12)
1 Home: implemented on main; live visual QA not verified.
2 Request Recovery: implemented, ten service rules, conditional destination and UK schedule; live integration not verified.
3 Estimate: implemented, read-only unavailable price in Production; live quote blocked.
4 Driver Offers: implemented frontend/API foundation; real offers blocked.
5 Driver Details: implemented frontend; real authenticated records not verified.
6 Booking Confirmation: implemented; live bookings disabled.
7 Customer Tracking: implemented, requires authorized job; live tracking not verified.
8 Driver Registration: UI/API exists; registration writes disabled; PR #56 separate.
9 Driver Subscription: membership UI exists; Stripe billing disabled; PR #53 separate.
10 Driver Dashboard: basic main exists; premium PR #62 open.
11 Admin Dashboard: basic main exists; premium PR #63 open.
12 Mobile Menu: SS12 menu in main; browser regression required.
Public /preview/customer, /preview/driver, /preview/admin: synthetic-only; noindex; flag in src/lib/dashboard-preview.ts.

## Backend status / remaining work
| Feature | Status | Missing / next verification | Service | Priority |
|---|---|---|---|---|
| Supabase project isolation | BLOCKED | Compare authorized Production/Preview project refs, keys without revealing secrets | Supabase/Vercel | P0 |
| Database migrations / RLS | PARTIALLY CONNECTED | Audit deployed schema, policies, triggers and grants vs 0001-0015 | Supabase PostgreSQL | P0 |
| Customer auth/profile | PARTIALLY CONNECTED | Real isolated signup, login, role and email confirmation tests | Supabase Auth | P0 |
| Driver auth/onboarding | BLOCKED | Validate PR #56, private uploads, pending approval, role escalation | Supabase Auth/Storage | P0 |
| Admin authentication | PARTIALLY CONNECTED | Real isolated admin session, RLS and negative tests | Supabase Auth | P0 |
| Private driver documents | PARTIALLY CONNECTED | Verify private bucket, signed URLs, policy and expiry | Supabase Storage | P0 |
| UK postcode / reverse lookup | PARTIALLY CONNECTED | Real external provider response/failure tests | postcodes.io | P1 |
| Address autocomplete | PARTIALLY CONNECTED | Geoapify key presence and fallback tests | Geoapify/postcodes.io | P1 |
| GPS pickup | PARTIALLY CONNECTED | Browser permissions and manual fallback QA | Browser Geolocation/postcodes.io | P1 |
| Driving distance | PARTIALLY CONNECTED | Confirm ORS or configured routing provider, valid keys, actual miles | OpenRouteService or routing provider | P1 |
| Google Routes integration | CODE PRESENT | GOOGLE_MAPS_SERVER_API_KEY and real route tests if selected | Google Maps Routes | P1 |
| Map display | PARTIALLY CONNECTED | Browser tile/network and marker checks | OpenStreetMap tiles | P1 |
| Estimate/pricing | BLOCKED IN PRODUCTION | Confirm active pricing rule, live distance, holiday provider, staging end-to-end | Supabase pricing_rules, route provider | P1 |
| Admin pricing management | DISABLED IN PRODUCTION | Staging authorized write and RLS tests | Supabase | P1 |
| Recovery jobs and photos | DISABLED IN PRODUCTION | Staging insert, private contacts, 3x5MB and rollback tests | Supabase/Storage | P1 |
| Driver matching/eligibility | PARTIALLY CONNECTED | Secure nearby matching, coverage, service, approval, membership tests | Supabase/PostGIS or coordinates | P1 |
| Driver offers | DISABLED IN PRODUCTION | Approved driver only, offer ETA/price, idempotency and ownership | Supabase | P1 |
| Customer acceptance | DISABLED IN PRODUCTION | Atomic RPC, concurrent offers, owner-only tests | Supabase RPC | P1 |
| Booking/status | DISABLED IN PRODUCTION | Authorized transitions, confirmation and cancellation | Supabase | P1 |
| Tracking | PARTIALLY CONNECTED | Authenticated tracking, ownership, stale ETA/location | Supabase/maps | P2 |
| Driver membership | PARTIALLY CONNECTED | Active/expired enforcement with real staging accounts | Supabase | P0 |
| Stripe billing | NOT ACTIVE | Client-approved plans, Stripe test mode, checkout, webhook, idempotency | Stripe | P2 |
| Notifications | NOT ACTIVE | Opt-ins, templates, provider credentials, outbox processing and retry | Email/SMS/Web Push | P2 |
| Google OAuth | DISABLED IN PRODUCTION | Isolated staging callback, role/redirect validation and explicit approval | Google/Supabase | P2 |
| PWA | CODE PRESENT | Real install and service-worker browser/device QA | Browser PWA | P2 |
| Custom domain | NOT CONNECTED | DNS, TLS, Supabase redirect URLs and provider origins after approval | Registrar/Vercel | P3 |

## Key audit observations
- src/lib/client-review.ts always returns true. proxy.ts centrally blocks writes, while this PR adds defense-in-depth guards to three handlers.
- app/api/recovery/open-estimate/route.ts deliberately returns an unavailable price in client review; never claim a verified Production quote.
- Postcode provider is postcodes.io; optional Geoapify suggestions; ORS and configured routing URL; separate Google Routes implementation exists. Configured production provider is not verified.
- Main /driver and /admin differ from draft PR #62 and #63.
- Google OAuth gate contains distinct staging and production project IDs in code; actual Vercel environment isolation is NOT verified.
- Verify Production API endpoints are protected by proxy on the deployed build. Direct route guards are preferable defense in depth.
- No Production DB or environment mutations, no schema changes, no secrets inspected, no domain changes.

## Required client/owner inputs
Approved staging environment access (no secrets in chat), synthetic authorized Customer/Approved Driver/Pending Driver/Admin accounts, approved pricing rates, driver membership plans, map provider billing/configuration, Stripe test account and webhook plan, notification provider choices, driver verification criteria and launch authorization.

## Recommended order
1 Confirm Production/Staging isolation and audit RLS/role escalation.
2 Authenticated staging security tests and PR #56 prerequisites.
3 Customer jobs, documents and atomic matching/offer/acceptance.
4 Pricing and route-provider end-to-end validation.
5 Driver/Admin draft PR review and membership enforcement.
6 Stripe test subscriptions, then notifications and tracking.
7 Full responsive/browser QA, accessibility, deployment review.
8 Only after approval: production rollout and custom domain/DNS/redirect updates.
