# PR #9 deployment and verification

This feature remains a draft until tested against a disposable Supabase project.

## Required migrations
Apply existing migrations in sequence using the Supabase CLI or SQL editor:
- supabase/migrations/0001_initial.sql
- all existing intermediate auth/RLS migrations
- supabase/migrations/0003_guest_recovery_jobs.sql

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
