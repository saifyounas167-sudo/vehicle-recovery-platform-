-- UK Recovery Customer + Admin milestone: READ ONLY post-deployment verification.
-- Run after manually approved 0019 migration, ONLY in Staging.
WITH checks AS (
 SELECT 'recovery_jobs table' AS check_name,
  to_regclass('public.recovery_jobs') IS NOT NULL AS passed
 UNION ALL SELECT 'private contacts table',to_regclass('public.recovery_job_private_contacts') IS NOT NULL
 UNION ALL SELECT 'rate limits table',to_regclass('public.recovery_request_rate_limits') IS NOT NULL
 UNION ALL SELECT 'rate-limit RPC',to_regprocedure('public.allow_recovery_request(text)') IS NOT NULL
 UNION ALL SELECT 'jobs RLS enabled',COALESCE((SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.recovery_jobs')),false)
 UNION ALL SELECT 'contacts RLS enabled',COALESCE((SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.recovery_job_private_contacts')),false)
 UNION ALL SELECT 'rate limits RLS enabled',COALESCE((SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.recovery_request_rate_limits')),false)
 UNION ALL SELECT 'authenticated may SELECT jobs',
  has_table_privilege('authenticated','public.recovery_jobs','SELECT')
 UNION ALL SELECT 'authenticated cannot INSERT jobs',
  NOT has_table_privilege('authenticated','public.recovery_jobs','INSERT')
 UNION ALL SELECT 'anon cannot SELECT jobs',
  NOT has_table_privilege('anon','public.recovery_jobs','SELECT')
 UNION ALL SELECT 'private contacts not visible to authenticated',
  NOT has_table_privilege('authenticated','public.recovery_job_private_contacts','SELECT')
 UNION ALL SELECT 'rate-limit RPC restricted',
  NOT has_function_privilege('authenticated','public.allow_recovery_request(text)','EXECUTE')
 UNION ALL SELECT 'rate-limit RPC service-role access',
  has_function_privilege('service_role','public.allow_recovery_request(text)','EXECUTE')
 UNION ALL SELECT 'Customer/Admin jobs SELECT policy',
  EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recovery_jobs'
   AND policyname='milestone customer own and admin jobs read')
 UNION ALL SELECT 'Auth trigger enabled',
  EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='auth.users'::regclass
   AND tgname='on_auth_user_created_customer' AND tgenabled='O')
)
SELECT check_name, CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS result FROM checks ORDER BY check_name;
-- Do not perform live signup, recovery request or approval writes as part of this script.
