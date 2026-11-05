-- UK Recovery Production ONLY. REVIEW / EXPLICIT SEPARATE APPROVAL REQUIRED.
-- Never run as part of CI. Do not execute until approved.
BEGIN;
DO $verify$
BEGIN
 IF to_regclass('public.recovery_jobs') IS NULL
 OR to_regclass('public.recovery_job_private_contacts') IS NULL
 OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.recovery_jobs'::regclass)
 OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.recovery_job_private_contacts'::regclass)
 THEN RAISE EXCEPTION 'Customer/Admin Production prerequisites missing'; END IF;
 IF has_table_privilege('anon','public.recovery_jobs','INSERT')
 OR has_table_privilege('authenticated','public.recovery_jobs','INSERT')
 OR has_table_privilege('anon','public.recovery_job_private_contacts','SELECT')
 OR has_table_privilege('authenticated','public.recovery_job_private_contacts','SELECT')
 THEN RAISE EXCEPTION 'Unexpected public grants; investigate before release'; END IF;
END $verify$;
-- The audited deficiencies: service-role INSERT on exactly two tables.
GRANT INSERT ON TABLE public.recovery_jobs TO service_role;
GRANT INSERT ON TABLE public.recovery_job_private_contacts TO service_role;
COMMIT;
-- Never revoke these grants as a rollback without checking other consumers.
