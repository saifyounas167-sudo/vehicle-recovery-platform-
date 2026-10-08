# PR #9 deployment and verification

This feature remains a draft until tested against a disposable Supabase project.

## Required migrations
Apply existing migrations in sequence using the Supabase CLI or SQL editor:
- supabase/migrations/0001_initial.sql
- all existing intermediate auth/RLS migrations
- supabase/migrations/0003_guest_recovery_jobs.sql
- supabase/migrations/0004_private_recovery_photos.sql
- supabase/migrations/0005_offer_acceptance_guard.sql

Review the schema first. Do not run initial migration twice against an existing production database. Take a backup before migrating.

## Environment variables (configure in Vercel, never commit values)
- NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY: browser public key
- SUPABASE_SERVICE_ROLE_KEY: server only, used by guest submission/pricing
- GUEST_REQUEST_HASH_SECRET: random secret of at least 32 characters, server only
- GOOGLE_MAPS_SERVER_API_KEY: Google Routes and Geocoding server key, enable both APIs and restrict credentials appropriately
- DVLA_VEHICLE_API_KEY: DVLA Vehicle Enquiry API key, server only

Admin pricing values must be supplied by the business through /admin/pricing. No rates are seeded. Bank holiday lookup currently uses England and Wales calendar only; expand to region-specific holiday logic before relying on Scottish or Northern Irish surcharges.

## Known blockers and security review
- Guest submission has NOT been verified against a live test database.
- The guest endpoint currently uses service role and a time-bucket duplicate fingerprint plus honeypot; deploy behind managed rate limiting and bot protection before exposing publicly.
- Guest private contact table has RLS enabled and no anon/authenticated grants; verify policies in test database, including any existing broad grants.
- Verify that driver-facing RLS policies never expose guest contact information.
- Pricing rules are stored in rule_config JSON. Existing pricing API supports configured fees and driving mileage; missing required configuration should show unavailable, not a fabricated estimate.
- Nearest Garage mode does not select a garage automatically.
- GPS postcode requires Google Geocoding. Manual postcode remains available.
- DVLA response typically does not include model; manual model entry remains required.
- Secure photo upload is NOT yet implemented. Do not expose public photo buckets or put photo contents in JSON.
- Full integration tests, responsive browser tests and production deployment verification are still pending.
- Do not merge this draft until all critical tests pass.

## Photo upload security
The recovery-vehicle-photos bucket is private. The upload endpoint validates a job-scoped HMAC, checks magic bytes, limits uploads to 5 MB each, and links objects in recovery_job_photo_access. Do not create public storage policies. A separate authorized photo retrieval API has not yet been implemented, so photos are not currently visible to drivers. Do not treat this as a completed photo-access feature.

## Required integration checks (not yet executed)
1. Create a disposable Supabase project; apply migrations in numeric order, verify bucket remains private.
2. With anonymous credentials, confirm SELECT from recovery_job_private_contacts and recovery_job_photo_access is denied.
3. Submit a guest job using valid UK contact/vehicle data, verify exactly one recovery_jobs row and one private contact row via trusted service role.
4. Retry identical payload within five minutes: expect HTTP 429 and no extra row.
5. Upload JPG/PNG/WebP with the issued job token: verify private storage and linked row. Reject invalid token, spoofed file header, >5MB, and fourth photo.
6. Confirm a different guest/driver cannot download photo or read private contacts.
7. Test full wizard at 375px, 430px, tablet and desktop with actual browser automation.
8. Verify preview deployment after Vercel access is restored.

## PR #9 current integration boundaries
- Guest offers: /api/recovery/guest-offers accepts a signed guest proof returned after submission; /api/recovery/accept-offer uses migration 0005 to atomically assign a chosen driver. The guest proof is currently not recoverable after a browser refresh and is not time-limited. Before production, implement durable, revocable, expiring guest sessions and verified recovery flow.
- Pricing: GET /api/recovery/estimate is actually POST. It requires active pricing_rules.rule_config and Google Routes for transport. The bank holiday calendar uses postcode region heuristics; manually verify edge cases (cross-border postcode areas).
- Photos: upload is private and job-token scoped, but authorised photo viewing is not implemented. Driver/customer retrieval must verify assigned/approved role and use short-lived signed URLs, not public URLs.
- Driver membership eligibility and notifications are not verified. Existing marketplace rules must be audited before launch.
- Security: the honeypot and duplicate fingerprint are not a sufficient production rate limiter. Add edge/WAF throttling plus a durable server-side limiter before public rollout.
- This repository's CI verifies code/tests but does not have a test Supabase database, Maps API credentials, DVLA credentials or browser E2E environment. Do not interpret CI success as live integration success.
