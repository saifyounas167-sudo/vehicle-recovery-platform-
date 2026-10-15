# SS3–SS5 dynamic marketplace staging and release gates

## Git strategy
- PR #39 is the combined **DRAFT** release PR from the tested SS3 PR #38 commit. PR #38 remains open and unmerged.
- **Do not merge either PR** until owner approves one combined release and staging evidence.
- Do not manually deploy to Vercel. GitHub integration may autonomously trigger builds on pushes; no guarantee of exactly one deployment without separately approved settings.

## Implemented in code
- SS3 preserved: estimates come from existing server road-routing and admin pricing configuration; unavailable when not authoritative.
- SS4 displays only offer records returned by server after valid guest proof and matching guest job ID; includes price/ETA sorting, truthful missing ratings, empty/error/loading, refresh.
- SS5 displays actual offer/driver details and requires success response from the existing atomic acceptance RPC before claiming selection.
- Driver registration and profile update, services, vehicle capability, real UK postcode lookup for coverage radius; defaults to **Pending**, offline.
- Private document upload and admin-only short-lived signed document inspection, Admin approve/reject/suspend with explicit review confirmation.
- Database staging migration 0013 tightens driver job RLS and offer eligibility to approval, active membership, availability, real recorded postcode-centre coverage, services and vehicle capability. Routes use postcode-centre coordinates, NOT verified driving miles.
- Driver dashboard contains real eligible available jobs, My Offers and availability.
- Migration 0014 queues notification events/preferences only; **no email/SMS/web-push delivery or external sends**.

## Strict isolation
Current Production remains permanently client-review/read-only unless a separate future launch is approved. Staging writes are allowed only when ALL of these are explicitly set AND distinct:
`VERCEL_ENV=preview`, `MARKETPLACE_STAGING_MODE=enabled`, `NEXT_PUBLIC_SUPABASE_URL` equal to `STAGING_SUPABASE_URL` but unequal to `PRODUCTION_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` equal to `STAGING_SUPABASE_SERVICE_ROLE_KEY` but unequal to `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY`. In addition Supabase publishable key, `GUEST_REQUEST_HASH_SECRET`, authentic emails and postcode/routing credentials/providers must be staging-specific.
DO NOT put secret values in GitHub source, the browser, or public logs. These environment conditions have not been configured or verified here.

## Required staging before release
1. Confirm a distinct authorised staging Supabase project and actual applied migrations 0001–0012; apply 0013–0014 **only after manual review**.
2. Validate SQL migrations and Storage private bucket/policies in disposable staging. RLS test with distinct anon, customer, driver and admin accounts and negative direct API attempts.
3. Test signup/verified email, profile, postcode coverage, private uploads, human admin review, approved driver availability, membership fixture (no real Stripe).
4. Persist a genuine staging test job with real pickup postcode-centre coordinates. Verify eligible drivers see it and nonmatching/unverified/offline drivers cannot.
5. Submit actual staging offer with real database insertion, verify guest HMAC proof restricts reads to own job, sort offer values, inspect driver details, accept exactly once under concurrent requests.
6. Test job/offer notifications in staging outbox, no public notification sends.
7. Test all 7 browser widths and compare original client SS3, SS4 and SS5 references; distinguish mock browser tests from real integrations.
8. Verify Production request/offer/Stripe/admin/document writes still return read-only denial, no migrations applied.
9. Get explicit owner approval for combined PR and separately for any live commercial enablement.

## Known blockers
- Isolated staging Supabase credentials/environment, migration state and RLS integration are not provided/verified.
- Stripe membership payments, real email/SMS/web-push delivery, sound alerts and actual driver reviews are not active; don't invent amounts/ratings.
- No verified live routing/admin pricing in current read-only Production; fallback is **Price to be confirmed by recovery drivers**.
- Photo/document correctness and legally sufficient UK verification require actual human admin checks; uploaded file presence does not prove authenticity.
- Existing SS6 booking confirmation should not claim success without genuine accepted RPC result.
- This PR is **NOT RELEASE-READY** until every critical staging/security/visual check is passed.
