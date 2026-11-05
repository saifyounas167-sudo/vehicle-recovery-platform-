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
