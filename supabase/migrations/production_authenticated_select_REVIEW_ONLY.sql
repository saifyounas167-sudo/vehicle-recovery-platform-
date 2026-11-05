-- PRODUCTION ONLY / EXPLICIT APPROVAL REQUIRED / DO NOT EXECUTE YET.
-- Customer/Admin SELECT privileges also activate already-existing assigned/approved Driver
-- visibility. They do NOT enable Driver onboarding, matching, or Stripe.
-- Preflight fails closed if current_user_role() or profile role-write protection cannot
-- be established; review all permissive Driver SELECT policies before approval.
BEGIN;
DO $verify$
DECLARE role_fn oid; role_source text;
BEGIN
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.profiles'::regclass)
 OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.recovery_jobs'::regclass)
 THEN RAISE EXCEPTION 'Required RLS is not enabled'; END IF;
 SELECT p.oid,pg_get_functiondef(p.oid) INTO role_fn,role_source
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='current_user_role' AND p.pronargs=0;
 IF role_fn IS NULL OR NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=role_fn AND prosecdef)
 OR role_source NOT ILIKE '%auth.uid()%'
 OR role_source NOT ILIKE '%profiles%'
 THEN RAISE EXCEPTION 'Admin role function requires manual security review'; END IF;
 IF has_column_privilege('authenticated','public.profiles','role','UPDATE')
 OR has_table_privilege('authenticated','public.profiles','UPDATE')
 OR has_column_privilege('anon','public.profiles','role','UPDATE')
 THEN RAISE EXCEPTION 'User-controlled role UPDATE privilege present'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
  AND cmd IN ('SELECT','ALL') AND qual ILIKE '%auth.uid()%')
 OR NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recovery_jobs'
  AND cmd IN ('SELECT','ALL') AND qual ILIKE '%customer_id%' AND qual ILIKE '%auth.uid()%')
 OR NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recovery_jobs'
  AND cmd IN ('SELECT','ALL') AND qual ILIKE '%current_user_role%')
 THEN RAISE EXCEPTION 'Required Customer/Admin RLS predicates missing'; END IF;
 IF has_table_privilege('authenticated','public.recovery_job_private_contacts','SELECT')
 OR has_table_privilege('anon','public.recovery_job_private_contacts','SELECT')
 THEN RAISE EXCEPTION 'Private contact read privileges unsafe'; END IF;
END $verify$;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.recovery_jobs TO authenticated;
COMMIT;
