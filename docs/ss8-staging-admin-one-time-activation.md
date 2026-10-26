# PR #56: one-time Staging Admin activation — SECURITY HANDOVER

**Status: blocked until existing deployed Staging trigger is independently reviewed and a narrowly scoped database RPC is installed by the authorized database owner.** No SQL is executed by this PR. Do not run these steps on Production.

Scope pinned by code: **Vercel Preview branch `feature/ss8-driver-approval-inbox-secure`** and existing `uk-recovery-staging` project `ozphvosiqbzvkthlppkd`. No effect on production PWA; use separately installed Preview PWA to test real Staging workflows.

## Why manual Staging database authorization is required
Existing `public.profiles` record is `customer`, and the deployed `s8_protect_role()` trigger rejects ad-hoc role updates with SQLSTATE P0001. Its deployed definition and execution privileges have not been independently verified. A service-role UPDATE might be denied too. **Do not disable/replace/alter the trigger or weaken RLS to pass testing.**

The app endpoint `POST /api/staging/admin-activate` is **fail closed** and calls `public.activate_single_staging_admin(p_user_id uuid,p_email text)` only after: exact Preview branch/project check, explicit opt-in, verified Supabase Auth session, verified email for the matching pinned UUID, existing `customer` profile and comparison of a server-side SHA-256 digest of a long one-time setup authorization.

## Review and configuration (not automated)

1. In **existing Staging Supabase only**, read-only inspect `pg_get_functiondef('public.s8_protect_role()'::regprocedure)` and relevant `pg_trigger` definitions; verify table policies and the actual Auth UUID and email-confirmed status. No shared credentials in chat.
2. A privileged, audited database owner must **separately review and manually install** a purpose-built `public.activate_single_staging_admin` procedure compatible with the existing trigger. Do not infer that SECURITY DEFINER automatically bypasses a trigger. If a lawful trigger-preserving activation mechanism cannot be established, STOP and use a separate approved admin provisioning process.
3. Procedure must be non-public, callable only from a trusted server credential (no `anon`/`authenticated` EXECUTE), pinned to the exact Staging account ID and confirmed email, reject attempts if any Admin already exists, and atomically consume a single-use activation authorization. Serialize concurrent attempts with an advisory transaction lock or equivalent database unique invariant. On success, set only the one authorized profile role to `admin` while preserving trigger protections for everyone else. Return true exactly once; subsequent calls must fail.
4. Restrict Vercel variables to this PR's **Preview** branch only: `STAGING_ADMIN_ACTIVATION_ENABLED=enabled`, `STAGING_ADMIN_USER_ID` verified from Staging Auth, and `STAGING_ADMIN_SETUP_TOKEN_SHA256` containing the SHA-256 hex digest of a random unique setup token (minimum 32 bytes of entropy); never save the token itself in Git, logs or files. The token is entered once via the app after signing in to that same Staging account. All existing Preview Supabase environment settings must point only to Staging.
5. The app's **`proxy.ts` must grant only this POST path under the same exact Preview+Staging check** before a manual Preview redeploy. The route itself still enforces every check. Never permit this route on Production.
6. After a successful activation, remove/disable the activation environment flag and separately redeploy Preview. Verify ordinary Admin Login `/login?role=admin`, protected Admin dashboard and deny all role escalation/second-admin attempts.
7. Existing Driver account and existing Customer role records must remain unchanged. Live recovery jobs, offers, payments and notifications stay disabled.

**Caution:** `/staging/admin-activate` is an entry form, **not a working Admin signup** until database procedure installation, route allowlisting and authenticated Staging E2E checks are approved. No future step should assert readiness from static tests alone.
