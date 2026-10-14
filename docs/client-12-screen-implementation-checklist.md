# UK Recovery — 12-Screen Implementation Checklist (Client Roadmap)

**Source of truth:** original client RoadMate 12-screen reference controls presentation and visible journey; approved written UK Recovery requirements control business logic, API, validation and security. UK Recovery identity; black/white/#FF6600; *Simple, Quick & Easy*. The screenshot's £95–£140 and £39.99 are NOT approved prices. **Production is read-only**. This checklist is planning/audit only—not proof of deployed features or client sign-off.

**Approved base pricing:** £5 fixed call-out + £3 per **verified road mile**, authoritative server calculations and Admin-configurable rates required. No verified miles or active authorised rules ⇒ “Price to be confirmed by recovery drivers.” First-phase customers pay their chosen driver directly.

## 01 Homepage

- **Reference layout:** Dark header, truck hero, orange quote CTA, compact service cards, trust indicators
- **Visible buttons/controls:** Get Recovery Quote, 10 service links, Near Me, Driver, menu
- **Expected interactions/conditional fields:** Direct form; service preselection; no duplicate quote panel
- **Existing implementation:** Hero + services and routes exist; CTA direct in PR37
- **Missing functionality / blockers:** Service preselection absent; compact More Services optional
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
- **Missing functionality / blockers:** Over-required make/model, transmission, accident, email; optional destination vs transport backend conflict; manual fallback issue; condition rules need client decision
- **Backend/API dependencies:** Postcode, autocomplete, GPS, vehicle lookup, estimates; current jobs POST
- **Database dependencies:** migration 0011 passenger count application unverified
- **Security requirements:** No live submissions; no private data in session; permission checks
- **Tests needed:** Every accordion/input, postcode API error, history, refresh, seven widths, payload tests
- **Production readiness:** PR37 preview; contract fixes and client decisions pending

## 03 Estimate Result

- **Reference layout:** Simple estimate amount/fallback, distance, vehicle/service, Continue
- **Visible buttons/controls:** Continue to offers when active
- **Expected interactions/conditional fields:** Only verified road miles, £5+£3/mi, no fabricated £95–£140; safe unavailable state
- **Existing implementation:** Estimate POST + pricing rules basis; embedded review in form
- **Missing functionality / blockers:** Dedicated approved UI/continue not implemented; live pricing DB unverified
- **Backend/API dependencies:** Road routing, postcode resolver, pricing API
- **Database dependencies:** pricing_rules active row / staging seed only
- **Security requirements:** Read-only; server is authoritative
- **Tests needed:** Formula rounding, missing routes/rates, visual reference, screen transitions
- **Production readiness:** Not started; estimate preview available

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
2. Decide which service types require destination vs roadside-only help, and minimum vehicle/contact details; do not silently invent defaults or make backend looser than necessary.
3. Verify migration 0011 and active pricing_rules in authorised staging before live commercial activation; do not modify Production schema or bypass read-only middleware.
4. Real Postcodes.io/Geoapify, routing, physical GPS, Supabase and Stripe only PASS after authorised real tests; mocks must be explicitly labelled.
5. Implement screens 3–12 in order only after screen 2 approved, on separate small PRs with CI and preview.
