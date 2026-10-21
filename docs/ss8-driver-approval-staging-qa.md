# SS8 Driver registration / approval — isolated staging QA

Scope: **Only uk-recovery-staging**. No production credentials, migrations, or marketplace activation.

## Prerequisites
- Use the existing isolated Supabase project with private bucket `driver-verification-private` and the existing tables `profiles`, `driver_profiles`, `driver_verification_documents` and `driver_memberships`. Do not create a replacement database.
- Test with disposable Driver and Admin test accounts and staging-only Next.js/Vercel Preview deployment.
- The dedicated onboarding status must return `{"clientDemo":true,"writesEnabled":false,"isolatedStaging":false,"driverRegistrationEnabled":true}` at `/api/client-review-status`, and `/api/driver/registration-status` must return `{"registrationEnabled":true}`. Broad marketplace writes intentionally stay OFF. If either registration value is false, **STOP**; do not bypass the gate.
- Verify the bucket remains private and existing role/approval triggers and RLS policies are enabled. Do not loosen them.
- Supabase Auth confirm-email setting is provider-controlled. With Confirm Email OFF, Auth creates an immediate session; with it ON, use verified email before application. Neither mode grants driver approval.

## Real test cases
1. New driver signs up, enters name/email/UK phone/password, optional company, truck type, services, capabilities, postcode/radius. A **pending/offline** driver profile is persisted; Customer and Admin roles cannot be chosen.
2. Driver Dashboard displays **Pending Admin Approval** and reads back company/truck/services/coverage. No job feed or offer details appear.
3. Driver uploads valid ID and insurance PDF/JPG/PNG into private storage; uploads over 5 MB or invalid signatures reject. No special Driving Licence or business-document type is mandatory. Profile and truck photos are stored privately.
4. Driver can list only their own upload metadata and open own documents via time-limited signed URLs. A different driver's UUID must yield 404. No public bucket access.
5. Admin Dashboard shows a real pending-application count. Admin Reviews shows the matching saved application, private document controls and Approve/Reject.
6. Attempt to approve without required documents, without coverage/services or without checking review-confirmation: must reject. Complete valid ID and insurance application: approval succeeds, availability stays `offline`.
7. Driver with pending/rejected/suspended status cannot read protected job detail pages or post offers. An approved driver without an active, unexpired membership also cannot access jobs/offers. Production marketplace remains read-only.
8. Authenticated Customer cannot read Admin approval data or upload Driver documents. Wrong-role dashboards still redirect to 403.
9. Test existing Customer login/forgot password and Driver login/logout; ensure unchanged.
10. No SMS, web push, Stripe payments or new SQL migrations are necessary for this PR.

## Staging read-only verification queries
```sql
SELECT approval_status, count(*) FROM public.driver_profiles GROUP BY approval_status;
SELECT d.id, d.approval_status, d.availability, count(v.id) AS uploaded_documents
FROM public.driver_profiles d LEFT JOIN public.driver_verification_documents v ON v.driver_id=d.id
GROUP BY d.id, d.approval_status, d.availability ORDER BY d.id LIMIT 30;
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname='public' AND tablename IN ('profiles','driver_profiles','driver_verification_documents');
SELECT id, name, public FROM storage.buckets WHERE id='driver-verification-private';
```
Only synthetic test users/documents are permitted for mutations; follow staging test-data retention policy. Never run against Production.

## New schema dependency
Migration `supabase/migrations/0017_driver_client_requirements_staging.sql` is already reported verified on isolated Staging. Do NOT rerun blindly; inspect read-only metadata first if any schema error appears. Production SQL must not be run without separate approval. Production driver signup stays blocked by existing marketplace proxy until a separately reviewed, minimal account-only exception is approved. Keep jobs, offers and billing blocked.


## PR #56 isolated onboarding deployment settings (never reveal values)
- Scope all registration permissions to the Vercel **Preview** target for branch `feature/ss8-driver-approval-inbox-secure` only. An automatic Vercel redeploy must not be initiated until owner approves.
- Required: `VERCEL_ENV=preview` and `VERCEL_GIT_COMMIT_REF=feature/ss8-driver-approval-inbox-secure` (provided by Vercel), `MARKETPLACE_STAGING_MODE=enabled`.
- `NEXT_PUBLIC_SUPABASE_URL` and `STAGING_SUPABASE_URL` must point to the existing `ozphvosiqbzvkthlppkd` project. `PRODUCTION_SUPABASE_URL` must point to `eosrparfgrycdnykekcn`. No Production service-role secret is needed in Preview.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must be the **Staging** publishable key; `SUPABASE_SERVICE_ROLE_KEY` and `STAGING_SUPABASE_SERVICE_ROLE_KEY` must both be the existing **Staging** server credential. The server validates both against the pinned staging Supabase Auth settings endpoint before allowing onboarding routes. If verification fails, everything stays blocked.
- Keep real recovery bookings, offers, pricing updates, payments, emails, SMS and notifications disabled. `isolatedStaging:false` intentionally indicates the broader marketplace gate is OFF, **not** that scoped onboarding is disabled.
- Production project identifiers in source and supplied metadata should be reconciled independently before general marketplace launch; this PR pins the project identity supplied for PR #56 only.
