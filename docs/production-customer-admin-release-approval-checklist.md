# Customer/Admin Production release — APPROVAL GATE (DO NOT EXECUTE)
Target: existing Vercel Production project and existing client URL. Database: `eosrparfgrycdnykekcn`. PR #71 targets `main`.
 
## Already established
- Staging Customer -> Database -> Admin E2E verified; PR CI reported PASS.
- Production RLS policies: profiles self-read, jobs customer-own read, admin role read, assigned-driver read, approved-driver limited-state read.
- `current_user_role()` SECURITY DEFINER reads trusted `profiles.role` via `auth.uid()`.
- No ordinary table-level UPDATE privileges on profiles found.

## Blockers to clear BEFORE authorization
1. Confirm no `anon` or `authenticated` *column-level UPDATE* privilege on `profiles.role`; verify role-change protection triggers and role function EXECUTE grants/search_path and that no user-accessible RPC can change `profiles.role`. No privilege escalation by profile self-update.
2. Verify existing driver SELECT policies still restrict to assigned jobs or approved drivers with the specified job statuses; authenticated SELECT grants necessarily expose records allowed by *all* existing permissive SELECT policies.
3. Production environment keys must be present in Production scope and **must reference Production only** (never staging): `NEXT_PUBLIC_SUPABASE_URL`, `PRODUCTION_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY`, `GUEST_REQUEST_HASH_SECRET` (>=32 chars), `CUSTOMER_ADMIN_PRODUCTION_ENABLED`. The four role and URL keys must resolve as required by `src/lib/customer-production-gate.ts`. Do not expose values.
4. Reconfirm PR #71 CI on intended release SHA, check Production schema dependencies, intended URL/domain and no driver onboarding, matching or billing enablement.
5. Explicit separate approvals required: SQL execution, PR merge, production deployment, and feature activation.

## Prepared, NOT RUN — SQL scripts and exact grants
- `supabase/migrations/production_customer_admin_service_role_insert_APPROVAL_REQUIRED.sql`:
  `GRANT SELECT, INSERT, DELETE ON public.recovery_jobs TO service_role;`
  `GRANT INSERT ON public.recovery_job_private_contacts TO service_role;`
- `supabase/migrations/production_authenticated_select_REVIEW_ONLY.sql`:
  `GRANT SELECT ON public.profiles TO authenticated;`
  `GRANT SELECT ON public.recovery_jobs TO authenticated;`
  Only after privilege/protection/policy checks and approval; preserve RLS and never grant authenticated private contact access.
- No SQL or environment changes in this PR are auto-executed.

## Release procedure AFTER separate approvals
1. Record Production deployment SHA, environment scope/isolation, SQL preflight results and backup/recovery plan; verify production policy and role-update guards.
2. Execute only approved reviewed SQL on Production Supabase; run read-only permission/policy verification; stop on any mismatch.
3. Configure verified Production-scoped secret values without copying staging secrets; leave `CUSTOMER_ADMIN_PRODUCTION_ENABLED` disabled until final activation approval.
4. Ensure CI (tests, TS, build, security) passes on approved final PR SHA. Obtain explicit merge approval, then merge PR #71 only.
5. Obtain explicit deployment/activation approval; deploy existing Production Vercel project/URL, enable only Customer/Admin milestone, verify production isolation and route authorization with existing authorized accounts and minimal no-destructive E2E.
6. Roll back deployment or disable Customer milestone gate if post-release checks fail; do not roll back SQL grants blindly.

## Final audit reconciliation (5 November 2026)
- CONFIRMED: `authenticated` and `anon` have no `profiles.role` UPDATE privilege; `ss8_guard_profile_identity_trg` is enabled.
- STILL NOT PROVEN: enabled trigger is not enough to verify its action. The exact `pg_get_functiondef` of the trigger's `tgfoid`, including whether it blocks all unauthorized role changes and permits only trusted service-role actions, is absent from available evidence. Do not assert its logic PASS. Also verify all callable SECURITY DEFINER functions that might update the role.
- CONFIRMED from reviewed Production policy summaries: assigned Driver job visibility uses `assigned_driver_id=auth.uid()`; approved Drivers see limited `submitted`, `matching`, `offered` statuses. Authenticated SELECT is a table-wide grant filtered by the OR of ALL permissive SELECT RLS policies, so this *preserves and activates* existing Driver read visibility; it does not enable Driver onboarding, matching or billing. Confirm this existing visibility is acceptable before approval.
- FUNCTION: `current_user_role()` is SECURITY DEFINER and looks up `public.profiles.role` via `auth.uid()`. Source/owner/search_path and EXECUTE privileges should be checked as final runtime security evidence, not inferred just from SECURITY DEFINER.

## Current Production Vercel inventory (variable names/scopes ONLY)
- `NEXT_PUBLIC_SUPABASE_URL`: Production scope present; value NOT decrypted or verified.
- `CUSTOMER_ADMIN_PRODUCTION_ENABLED`, `PRODUCTION_SUPABASE_URL`, `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GUEST_REQUEST_HASH_SECRET`: Production-scope entries NOT FOUND as of latest inspection. Preview entries are not substitutes. `CUSTOMER_ADMIN_PRODUCTION_ENABLED` must be the exact string `enabled` only after separate activation approval. Check secrets match the actual Production project without revealing values; no Staging keys in Production.
- Existing website Production URL and Vercel project must be retained. New environment variables require a deployment to take effect; do not enable prematurely.

## Release stop/go criteria (no Production actions authorized)
STOP until: actual trigger body and role-RPC escalation reviewed; driver permissive policy exposure accepted; Production-scoped variables configured and identity verified; separately approved Production SQL granted; read-only post-migration checks verified; final SHA CI PASS; explicit merge and deployment approvals. Existing CI PASS is for an earlier SHA; revalidate after any PR edits.

After separate authorizations, order: approve/run minimum service_role SQL; verify; approve/run authenticated SELECT SQL; verify RLS and privacy; configure Production-scoped env with gate disabled; merge reviewed PR; deploy same Production project/client domain with gate disabled; explicitly approve enabling gate and redeploy; perform existing-account Customer submit -> own dashboard -> authorised Admin view and negative cross-role checks; if failed, disable gate/redeploy or revert deployment to prior SHA (never remove grants without impact review).

## Verified final gate update — 5 Nov 2026
- Production trigger `ss8_guard_profile_identity_trg` ENABLED, function `public.ss8_guard_profile_identity()`: verified by user to reject non-service_role changes to `profiles.id` and `profiles.role`, fixed search_path. Role-protection logic PASS. No further repeat audit requested.
- GitHub Actions CI PASS on commit `1c77ef5428e5033801dbb914726f04f68db7723d`, run 42040044653.
- Exact ordered approvals: (A) permission migration #1 (service_role) and #2 (authenticated SELECT), then verify read-only; (B) configure Production-only variables with milestone gate disabled; (C) final PR CI, explicit merge approval; (D) explicit same-project Production deployment approval; (E) explicit gate activation approval and deploy; (F) test existing account login, one controlled Customer request insert, own dashboard, Admin view, cross-role denial; rollback gate/deployment on failure. Never execute any part without relevant explicit approval.
- Environment Production scope observed: NEXT_PUBLIC_SUPABASE_URL present; CUSTOMER_ADMIN_PRODUCTION_ENABLED, PRODUCTION_SUPABASE_URL, PRODUCTION_SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE_KEY, GUEST_REQUEST_HASH_SECRET absent. Secret values were not decrypted.
