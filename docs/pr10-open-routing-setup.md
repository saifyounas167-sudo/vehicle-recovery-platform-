# Draft PR #10 — Free maps, routing, pricing and offers

This branch is independent from Draft PR #9. Do not merge or modify production.

## Preview routing setup (no Google Maps billing)
Choose **one** routing provider:
- OpenRouteService (ORS) free developer tier: sign up at https://openrouteservice.org/dev/#/signup, check current quota and terms. Add server-only `ROUTING_PROVIDER=ors` and `ORS_API_KEY` to Vercel **Preview**. The server calls ORS GeoJSON driving-car directions; keys never reach the browser.
- Self-managed OSRM-compatible HTTPS routing: set server-only `ROUTING_PROVIDER_URL=https://your-managed-routing-host`. Hosting/maintenance costs are not included. Never use public OSRM/OSM demo servers as a production dependency.

Postcodes.io is used to find postcode-centre coordinates, which are approximate. Customer must still confirm the pickup/drop-off address. Leaflet 1.9.4 is loaded from pinned unpkg CDN; OpenStreetMap raster tiles require proper attribution and compliance with https://operations.osmfoundation.org/policies/tiles/ . For production, use a contracted/managed tile provider or self-host tiles, with a production CSP and asset integrity strategy. Free service limits and uptime are not guaranteed.

## Server pricing
Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Preview only, pointing to a disposable test project. Configure **exactly one** active `pricing_rules` record. Its `rule_config` JSON must include all these admin-approved numeric nonnegative values:
`minimumCallout`, `pricePerMile`, `vehicleSurcharge`, `nonRunningSurcharge`, `lockedWheelSurcharge`, `accidentSurcharge`, `nightSurcharge`, `weekendSurcharge`, `bankHolidaySurcharge`, `urgentSurcharge`, `loadingDifficultySurcharge`, `specialEquipmentSurcharge`.

The protected `/admin/pricing` page can edit an existing complete active config. Incomplete/multiple configurations intentionally show unavailable; no GBP rates are invented. Regional UK bank holiday dates are fetched from gov.uk; missing calendar or routing data fails closed to "Price to be confirmed by recovery drivers". The quote is an estimate, not a binding driver price. Scheduled collection times must be valid ISO timestamps; currently the preview uses current UK time. Customer service-specific rate variation and granular vehicle categories are still limited and require business rules.

## Marketplace schema
The migration `supabase/migrations/0009_driver_membership_offers.sql` adds membership entitlements, driver ETA, RLS membership eligibility, an insert-time row lock to reject late offers, and atomic customer-selected offer acceptance. **Review and apply only to a separate test project**, after the applicable earlier migrations. It does not create paid memberships or payment integrations. Membership records must be created by an authorised admin workflow with a verified source of entitlement; never mark a driver active without payment/approval verification. Existing `0001` and `0002` migrations remain unchanged.

Customer offer comparison at `/customer/offers` requires an authenticated customer; guest offers from PR #9 are not connected in this separate branch. The outstanding PR #9 guest submission HTTP 503 is not bypassed or changed here.

## Verification gates
Run `npm test`, `npm run typecheck`, `npm run build`. GitHub CI runs these with placeholder Supabase variables; success does not prove live routing, pricing, membership, RLS, mobile maps or offers. Before merge: verify ORS driving route/mileage in Preview, approved pricing in test Supabase, test customer/driver membership and offer acceptance, race prevention, privacy, mobile browser map interactions, service quotas, abuse throttling and Vercel deployment. Keep Draft until these pass.

## Diagnosing stale customer pricing Preview
The customer form now calls `POST /api/recovery/open-estimate` after valid locations, vehicle type, condition and service have been entered. The hardcoded `Estimate calculated after route & pricing data` string was removed in PR #10. If the Preview still shows it, verify that the deployment is actually built from the current feature branch commit: visit `/api/build-info` on that Preview domain and compare `commit` with GitHub PR #10 head SHA. A Vercel deployment-specific URL references a particular build and does not automatically become a newer build after commits are pushed. Use the latest branch Preview deployment URL from Vercel. If no commit is returned, use the deployment Git metadata in Vercel.

**One-step test database setup:** In the Supabase SQL Editor for the **disposable Preview/test project only**, execute exactly the file [`supabase/test-seeds/pr10-temporary-pricing.sql`](../supabase/test-seeds/pr10-temporary-pricing.sql). DO NOT run this on the production database. The seed inserts a temporary active pricing rule only when none is active. If an active rule already exists, it remains unchanged and must be reviewed in Admin Pricing; the seed will not override it. Verified routing also requires both `ROUTING_PROVIDER=ors` and server-only `ORS_API_KEY` in Vercel Preview.

To verify test mileage and price, use SW1A 1AA → W1A 1AA, Car, Non-running, Breakdown. Inspect the response to `POST /api/recovery/open-estimate`; `route.distanceMiles` is from ORS driving geometry, and `estimatedPriceGbp` must be calculated from the *actual* road miles and active admin pricing, never made up. With temporary rates, the expected subtotal is GBP 70 + 2 × actual road miles, plus GBP 15 if the UK-local night surcharge applies; all other test surcharges are GBP 0. This is only a Preview test estimate, not a guaranteed driver quote. Never claim that tests pass without testing against a configured Preview and test database.
