# UK Recovery — 12-Screen Implementation Checklist (Client Roadmap)

**Source of truth:** original client RoadMate 12-screen reference controls presentation and visible journey; approved written UK Recovery requirements control business logic, API, validation and security. UK Recovery identity; black/white/#FF6600; *Simple, Quick & Easy*. The screenshot's £95–£140 and £39.99 are NOT approved prices. **Production is read-only**. This checklist is planning/audit only—not proof of deployed features or client sign-off.

**Approved base pricing:** £5 fixed call-out + £3 per **verified road mile**, authoritative server calculations and Admin-configurable rates required. No verified miles or active authorised rules ⇒ “Price to be confirmed by recovery drivers.” First-phase customers pay their chosen driver directly.

## 01 Homepage

- **Reference layout:** Dark header, truck hero, orange quote CTA, compact service cards, trust indicators
- **Visible buttons/controls:** Get Recovery Quote, 10 service links, Near Me, Driver, menu
- **Expected interactions/conditional fields:** Direct form; service preselection; no duplicate quote panel
- **Existing implementation:** Hero + services and routes exist; CTA direct in PR37
- **Missing functionality / blockers:** Service preselection implementation added on PR37; verify ten links in browser
- **Backend/API dependencies:** Location suggest/postcode, guest form handoff
- **Database dependencies:** None for display; approved routes and backend security
- **Security requirements:** No write on CTA
- **Tests needed:** Visual 7 widths; all 10 links and preselection; menu; no duplicate
- **Production readiness:** Preview PR37; service preselection pending

## 02 Request Recovery

- **Reference layout:** Four-stage progress, compact pickup/dropoff and expandable vehicle/issue
- **Visible buttons/controls:** GPS, postcode/address, vehicle, issue, Get Estimate, Back, edits
- **Expected interactions/conditional fields:** Destination by relevant service, running/rolling/wheels, passengers 0–8, ASAP/scheduled, optional notes/photos, contact
- **Existing implementation:** PR37 direct CTA, accordions, validation, preview estimate, refresh/history
- **Missing functionality / blockers:** Conditional frontend and shared server validator added; migration 0012 prepares nullable email, but authorised staging application, DB constraints and migration 0011 verification are still pending
- **Backend/API dependencies:** Postcode, autocomplete, GPS, vehicle lookup, estimates; current jobs POST
- **Database dependencies:** migration 0011 passenger count application unverified
- **Security requirements:** No live submissions; no private data in session; permission checks
- **Tests needed:** Every accordion/input, postcode API error, history, refresh, seven widths, payload tests
- **Production readiness:** PR37 preview; client conditional rules approved; staging/database and visual verification pending

## 03 Estimate Result

- **Reference layout:** Simple estimate amount/fallback, distance, vehicle/service, Continue
- **Visible buttons/controls:** Continue to offers when active
- **Expected interactions/conditional fields:** Only verified road miles, £5+£3/mi, no fabricated £95–£140; safe unavailable state
- **Existing implementation:** Dedicated Screenshot #3 Estimate Result in draft PR #38, with Details-to-Estimate transition, server estimate amount/fallback, distance/vehicle/service summary, Back/Edit and truthful read-only Continue
- **Missing functionality / blockers:** Original screenshot pixel-level comparison and authorised real routing/admin pricing integration are unverified; preview-only Continue announces that driver offers are coming soon
- **Backend/API dependencies:** Road routing, postcode resolver, pricing API
- **Database dependencies:** pricing_rules active row / staging seed only
- **Security requirements:** Read-only; server is authoritative
- **Tests needed:** Formula rounding, missing routes/rates, visual reference, screen transitions
- **Production readiness:** Dedicated UI preview in PR #38; not merged, no live estimate approval

## 04 Driver Offers

- **Reference layout:** Compact driver cards, filters Price/ETA/Rating
- **Visible buttons/controls:** Sort, View Details
- **Expected interactions/conditional fields:** Approved eligible drivers send independent prices/ETAs; user chooses
- **Existing implementation:** Offer schema/API foundation
- **Missing functionality / blockers:** Verified live offers/sorting/driver detail UI unfinished
- **Backend/API dependencies:** Offers listing and driver eligibility
- **Database dependencies:** Offers/memberships, driver profile
- **Security requirements:** No fabricated offers; authenticated customer proof
- **Tests needed:** Permission/RLS, sorting, no offers, concurrent acceptance
- **Production readiness:** Not ready

## 05 Driver Details

- **Reference layout:** Vehicle, verification, rating, price, ETA and coverage
- **Visible buttons/controls:** Choose This Driver
- **Expected interactions/conditional fields:** Manual customer selection; real driver data only
- **Existing implementation:** Driver profiles foundation
- **Missing functionality / blockers:** Client detail screen/action unfinished
- **Backend/API dependencies:** Driver profile and accept-offer APIs
- **Database dependencies:** Profiles, offers, selection transaction
- **Security requirements:** Verified identity; no auto-assign
- **Tests needed:** Access control, conflicting offers, authenticity
- **Production readiness:** Not ready

## 06 Booking Confirmation

- **Reference layout:** Success check, chosen driver, price, ETA
- **Visible buttons/controls:** View Booking, Back Home
- **Expected interactions/conditional fields:** Only show success after accepted offer, pay driver directly
- **Existing implementation:** Offer acceptance transaction foundation
- **Missing functionality / blockers:** Live confirmation not authorised
- **Backend/API dependencies:** Atomic offer acceptance and booking lookup
- **Database dependencies:** Recovery jobs + offers
- **Security requirements:** No fake success or payments
- **Tests needed:** Transaction rollback, idempotency, unauthorised reads
- **Production readiness:** Not ready

## 07 Customer Tracking

- **Reference layout:** Map, driver progress, contact, vehicle, ETA
- **Visible buttons/controls:** Call/Contact driver
- **Expected interactions/conditional fields:** Live tracking only when authorised; unavailable fallback
- **Existing implementation:** Route map foundation
- **Missing functionality / blockers:** Tracking and GPS updates unverified
- **Backend/API dependencies:** Authenticated tracking/location stream
- **Database dependencies:** Assignments and GPS records
- **Security requirements:** Consent, private positions, no fictitious ETA
- **Tests needed:** Map, permissions, GPS staleness, fallback
- **Production readiness:** Not ready

## 08 Driver Registration

- **Reference layout:** Short form, vehicle type and optional company
- **Visible buttons/controls:** Create Account, Login
- **Expected interactions/conditional fields:** Progressive coverage, services, insurance, documents, admin approval
- **Existing implementation:** Driver register/Auth scaffolding
- **Missing functionality / blockers:** Full verification and production registration pending
- **Backend/API dependencies:** Auth and driver verification APIs
- **Database dependencies:** Driver profiles, documents
- **Security requirements:** RLS/approval, no bypass
- **Tests needed:** Field validation, roles, uploads, verification
- **Production readiness:** Not ready

## 09 Driver Subscription

- **Reference layout:** Membership fee/features and payment status
- **Visible buttons/controls:** Subscribe when authorised
- **Expected interactions/conditional fields:** Stripe subscription later; screenshot £39.99 is not approved
- **Existing implementation:** Membership architecture foundation
- **Missing functionality / blockers:** Pricing approval and live Stripe pending
- **Backend/API dependencies:** Stripe checkout/webhooks
- **Database dependencies:** Membership, invoices
- **Security requirements:** No live charges
- **Tests needed:** Webhook signatures, pricing, cancellations
- **Production readiness:** Not ready

## 10 Driver Dashboard

- **Reference layout:** Compact New Jobs, My Offers, Active, Complete
- **Visible buttons/controls:** View & Send Offer, filters
- **Expected interactions/conditional fields:** Nearby matching, radius, availability, docs, notifications, invoices, referrals
- **Existing implementation:** Driver dashboard foundations
- **Missing functionality / blockers:** End-to-end approved job matching & offers disabled
- **Backend/API dependencies:** Jobs/offers/notification APIs
- **Database dependencies:** Drivers, jobs, memberships
- **Security requirements:** Verified drivers only; RLS
- **Tests needed:** Filters, status transitions, approval, real-time
- **Production readiness:** Not ready

## 11 Admin Dashboard

- **Reference layout:** Sidebar and truthful overview cards
- **Visible buttons/controls:** Dashboard, Jobs, Users, Drivers, Reviews, Reports, Settings, Pricing
- **Expected interactions/conditional fields:** £5 callout / £3 road mile Admin editable later + surcharges unset
- **Existing implementation:** Admin dashboard + pricing editor and role API
- **Missing functionality / blockers:** Production admin saves disabled; DB migration and config unverified
- **Backend/API dependencies:** Admin pricing/settings APIs
- **Database dependencies:** pricing_rules, profiles
- **Security requirements:** Server role checks + RLS; no demo mutation
- **Tests needed:** Admin vs customer role, save validation, audit, error
- **Production readiness:** Not ready

## 12 Mobile Menu

- **Reference layout:** Dark compact menu with icon list
- **Visible buttons/controls:** Home, Quote, Services, How It Works, Drivers, Pricing, About, FAQ, Contact, Login
- **Expected interactions/conditional fields:** Functional route links; close/keyboard navigation; role-aware items
- **Existing implementation:** Public mobile header/menu exists
- **Missing functionality / blockers:** Audit missing/unfinished links and menu match
- **Backend/API dependencies:** Navigation/auth session
- **Database dependencies:** None for public menu
- **Security requirements:** No unapproved pages implied live
- **Tests needed:** 320–430 widths, touch/keyboard, signed-in roles
- **Production readiness:** Partial

## Release gates and client decisions

1. **PR #37: no merge** until actual browser images at 320/375/390/430/768/1024/1440, form/CTA, backend contract, error recovery, privacy and visual client approval.
2. Approved conditional fields now reside in src/lib/recovery-service-rules.ts; re-test all 10 service categories and ensure write-time database migration compatibility before activating submissions.
3. Verify migration 0011 and active pricing_rules in authorised staging before live commercial activation; do not modify Production schema or bypass read-only middleware.
4. Real Postcodes.io/Geoapify, routing, physical GPS, Supabase and Stripe only PASS after authorised real tests; mocks must be explicitly labelled.
5. Implement screens 3–12 in order only after screen 2 approved, on separate small PRs with CI and preview.

## PR #37 approval implementation — 14 October 2026

- Approved 10 service identifiers preserved. Shared typed validation defines destination, transport/loading condition, accident and passenger questions. Roadside-only services do not require destinations; Breakdown Recovery asks one transport-versus-roadside question.
- Guest estimate requires pickup postcode/address, vehicle type, service, full name and UK mobile. Vehicle make/model, registration, transmission, email and description are optional. Scheduled timing requires a future date/time.
- Home service cards already link with a `service` query parameter; request page now consumes it and chooses the service group while preserving other choices. Requires live browser QA.
- Transport-only pricing requires a verified road route and active authoritative admin rules. £5 callout and £3/mile remain proposed approved base amounts, not fabricated default estimates.
- Production and review are fail-closed at jobs API even on direct POST requests. PR is still draft and must not merge.
- **BLOCKER**: write endpoint now accepts optional validated fields and persists missing data as NULL; migration 0012 makes private-contact email nullable. Actual Supabase constraints, RLS and migration 0011/0012 execution have not been checked in an authorised staging database. Keep writes disabled until this verification is complete.
- Screenshot #2 final visual approval pending genuine browser screenshots and customer original side-by-side comparison. Do not claim mocks equal real postcode, routing, database, or billing tests.

## Screenshot #3 implementation review notes

- PR #38 targets main; distinct focused feature branch. Existing request location cards and 10 service identifiers are unchanged.
- The dedicated client-reference Estimate screen highlights the orange second step, uses UK Recovery styling, displays server-derived price only when the existing endpoint reports an available price, and otherwise clearly says “Price to be confirmed by recovery drivers.”
- Indicative price is never copied from the RoadMate sample screenshot. Base £5 callout + £3 per verified mile remains controlled by existing active Admin pricing rules; all surcharge fields remain configurable, none invented.
- No database migration is applied. 0011/0012 staging status unverified. Driver offers/booking/payment/notifications remain read-only or disabled; Continue explicitly says that offers are coming soon.
- Browser QA mocks a server response and must be reported as **MOCKED**, not verification of real routing, postcode lookup, Supabase, or driver availability.
- Final client visual approval and authorisation required before merge or Production deploy. Screen #4 is deliberately not implemented.
