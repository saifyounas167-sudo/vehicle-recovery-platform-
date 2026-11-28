# Production first-Admin activation — review handover

**Status: implementation prepared in a separate review PR; Production activation remains BLOCKED until the manual prerequisites below are independently verified and approved.** Nothing in this PR runs against Supabase or changes a Production account.

## Scope and separation from PR #56

- Target Production Supabase project: `eosrparfgrycdnykekcn`.
- The only permitted account is `saifyounas112@gmail.com`.
- Production `main` was inspected at `41962fe397e2e91f0c2cab5072e4ac8bf68f34f4`.
- PR #56 remains a separate Staging/Preview draft. Its activation endpoint is pinned to the Staging Preview branch and Staging Supabase project, and calls `activate_single_staging_admin`. It is not a Production bootstrap and is not reused here.
- The pending client invitation `roadmate1@outlook.com` is outside this implementation and must remain untouched.

## Flow

1. The account must already exist in Production Supabase Auth. The normal customer signup flow may create only a Customer profile; this feature never creates Auth users.
2. The user signs in through the existing Customer Login and opens `/production/admin-activate`.
3. The server page and POST route require the Production deployment on branch `main`, the exact Production Supabase URL, the explicit feature flag, the exact pinned email, and `email_confirmed_at`.
4. The user supplies a one-time token. The route hashes it with SHA-256 and compares it with the server-only Production environment hash using `timingSafeEqual`.
5. The route calls `public.activate_initial_production_admin` using the existing server-only `serverDb()` service-role client. No service key is sent to the browser.
6. The database function independently requires a service-role JWT, locks the one-row activation record, checks the exact seeded Auth UUID and email, checks `auth.users.email_confirmed_at`, requires the matching profile to still be `customer`, and refuses if any Admin already exists.
7. The database changes only that profile's role and marks the activation row consumed in the same transaction. A failure rolls back both operations. A second or concurrent attempt cannot reuse the row.
8. On success, the browser signs out and redirects to Admin Login. After activation, disable the Production feature flag, remove the setup-token hash, and redeploy separately.

## Files in this PR

- `src/lib/production-admin-activation.ts` — shared Production-only feature gate and exact verified-email check.
- `app/production/admin-activate/page.tsx` — server-rendered activation page; no signup or role mutation.
- `app/production/admin-activate/activation-form.tsx` — password-style token input; no local/session storage.
- `app/api/production/admin-activate/route.ts` — same-origin POST, verified Auth session, high-entropy token hash comparison, server-only RPC call.
- `proxy.ts` — narrowly allows only this exact POST path when the same Production gate passes.
- `supabase/migrations/0016_production_initial_admin_activation.sql` — creates the private one-row allowlist and service-role-only RPC; does not seed a UUID or change any role when applied.
- `supabase/operations/production-initial-admin-seed.template.sql` — separate manual seed template requiring the already verified Auth UUID.
- `tests/production-admin-activation.test.mjs` — static security regression tests, included in the existing CI test command.
- `docs/production-first-admin-activation.md` — this handover.

## Required manual Production setup — not performed by this PR

Do these only after code review and an explicit decision to activate:

1. In Production Supabase Authentication → Users, confirm the exact account exists. Record its Auth UUID and confirm the email is verified. If it does not exist, stop; the owner must first create the ordinary Customer account and verify its email. Do not use Admin Invite or create a user through this feature.
2. Read-only inspect the deployed `public.ss8_protect_role()` definition and the profile trigger. Confirm it permits the trusted `service_role` request used by this RPC. Do not disable, replace, or weaken the trigger. If the deployed trigger does not permit this exact trusted path, stop and redesign with the database owner.
3. Review and apply `0016_production_initial_admin_activation.sql` to the Production project only after approval. It creates the private state table and RPC but does not seed or activate anyone.
4. Replace the placeholder in `production-initial-admin-seed.template.sql` with the verified Auth UUID and execute it once. The insert must fail rather than overwrite an existing activation row.
5. Verify that the existing Production `SUPABASE_SERVICE_ROLE_KEY` is already configured for the server-only `serverDb()` client. Do not expose it or add it to any `NEXT_PUBLIC_*` variable. If it is absent, stop; that is a separate configuration decision.
6. Generate a fresh 32-byte random token locally. Store only its 64-character SHA-256 hex digest in Vercel's **Production-only** environment variable `PRODUCTION_ADMIN_SETUP_TOKEN_SHA256`. Set `PRODUCTION_ADMIN_ACTIVATION_ENABLED=enabled` in Production only. Never put the raw token in Git, SQL, logs, screenshots, or chat. Example local generation command:

   ```bash
   node -e "const c=require('node:crypto');const t=c.randomBytes(32).toString('base64url');console.log('TOKEN='+t);console.log('SHA256='+c.createHash('sha256').update(t).digest('hex'))"
   ```

   Keep the token output private and enter it only on the Production activation page. Do not configure either variable in Preview or Development.
7. A Production deployment is required to pick up any later Vercel environment changes. No deployment is part of this PR.
8. Sign in as the existing verified Customer account, open `/production/admin-activate`, enter the token once, and confirm the success response. Then use Admin Login.
9. Immediately disable `PRODUCTION_ADMIN_ACTIVATION_ENABLED`, remove `PRODUCTION_ADMIN_SETUP_TOKEN_SHA256`, and perform a separately approved Production redeploy. The database consumed flag remains the permanent replay barrier.

## Security properties and fail-closed cases

- Exact email is pinned in the application and database function.
- Exact Auth UUID is pinned in the one-row database record; re-created or different accounts cannot inherit the allowlist.
- Email confirmation is checked against `auth.users`, not browser metadata.
- The activation token is high entropy, accepted only over same-origin POST, hashed server-side, and compared in constant time.
- The RPC is `SECURITY DEFINER` with an empty search path, and EXECUTE is revoked from `PUBLIC`, `anon`, and `authenticated`; only `service_role` is granted EXECUTE. The private table has RLS enabled and no client grants.
- The RPC requires the service-role JWT claim, locks the singleton row, refuses if any Admin exists, requires the profile to remain Customer, and consumes the row atomically with the role change.
- The existing role-protection trigger remains enabled. No trigger bypass, direct browser update, Auth Admin API user creation, or public Admin signup is added.
- Wrong project, Preview deployment, wrong branch, disabled flag, wrong email, unverified email, missing seed, existing Admin, wrong profile role, bad token, trigger rejection, or replay all fail closed.

## Review notes / migration ordering

The Production main branch currently has migrations through `0015`; PR #56 separately contains a Staging migration numbered `0017`. This PR uses the available `0016` slot. If PR #56 is merged first, reconcile migration ordering before applying either migration; do not apply an out-of-order migration or repair migration history casually.

Supabase's current database-function guidance requires an empty `search_path` for SECURITY DEFINER functions and explicit revocation of default EXECUTE grants from untrusted roles. This implementation follows that pattern. See:
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Rollback

Before activation, keep the feature flag disabled and leave the seed row unconsumed. After a successful activation, do not drop the migration objects as an automatic rollback: the Admin role change requires a separately reviewed and authorized action. No automatic role downgrade is included.
