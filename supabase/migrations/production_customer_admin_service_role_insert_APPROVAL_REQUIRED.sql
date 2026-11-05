-- REVIEW ONLY — Production eosrparfgrycdnykekcn. Explicit separate approval required.
-- No automatic execution. Current audit: service_role table grants below are missing.
-- Authenticated SELECT on profiles/recovery_jobs is intentionally NOT granted here:
-- verify exact SELECT RLS policy predicates (owner/admin roles) before separate approval.
BEGIN;
DO $verify$
BEGIN
 IF to_regclass('public.recovery_jobs') IS NULL
 OR to_regclass('public.recovery_job_private_contacts') IS NULL
 OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.recovery_jobs'::regclass)
 OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.recovery_job_private_contacts'::regclass)
 THEN RAISE EXCEPTION 'Production schema or RLS prerequisites missing'; END IF;
 IF has_table_privilege('anon','public.recovery_jobs','INSERT')
 OR has_table_privilege('authenticated','public.recovery_jobs','INSERT')
 OR has_table_privilege('anon','public.recovery_job_private_contacts','SELECT')
 OR has_table_privilege('authenticated','public.recovery_job_private_contacts','SELECT')
 THEN RAISE EXCEPTION 'Unexpected public grants: investigate'; END IF;
END $verify$;
-- API: INSERT ... SELECT on jobs; rollback on private-contact INSERT failure.
GRANT SELECT, INSERT, DELETE ON TABLE public.recovery_jobs TO service_role;
-- Private contact INSERT required; SELECT/DELETE not required by approved API.
GRANT INSERT ON TABLE public.recovery_job_private_contacts TO service_role;
COMMIT;
