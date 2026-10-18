# SS8 Driver registration / approval — isolated staging QA

Scope: **Only uk-recovery-staging**. No production credentials, migrations, or marketplace activation.

## Prerequisites
- Use the existing isolated Supabase project with private bucket `driver-verification-private` and the existing tables `profiles`, `driver_profiles`, `driver_verification_documents` and `driver_memberships`. Do not create a replacement database.
- Test with disposable Driver and Admin test accounts and staging-only Next.js/Vercel Preview deployment.
- The existing staging guard must return `{"isolatedStaging":true,"writesEnabled":true}` at `/api/client-review-status`. If false, **STOP**; do not bypass the guard.
- Verify the bucket remains private and existing role/approval triggers and RLS policies are enabled. Do not loosen them.
- Supabase Auth confirm-email setting is provider-controlled. With Confirm Email OFF, Auth creates an immediate session; with it ON, use verified email before application. Neither mode grants driver approval.

## Real test cases
1. New driver signs up, enters name/email/UK phone/password, optional company, truck type, services, capabilities, postcode/radius. A **pending/offline** driver profile is persisted; Customer and Admin roles cannot be chosen.
2. Driver Dashboard displays **Pending Admin Approval** and reads back company/truck/services/coverage. No job feed or offer details appear.
3. Driver uploads licence and insurance PDF/JPG/PNG into private storage; uploads over 5 MB or invalid signatures reject. If `company_name` is not empty, Business registration document is required for approval.
4. Driver can list only their own upload metadata and open own documents via time-limited signed URLs. A different driver's UUID must yield 404. No public bucket access.
5. Admin Dashboard shows a real pending-application count. Admin Reviews shows the matching saved application, private document controls and Approve/Reject.
6. Attempt to approve without required documents, without coverage/services or without checking review-confirmation: must reject. Complete valid application: approval succeeds, availability stays `offline`.
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
