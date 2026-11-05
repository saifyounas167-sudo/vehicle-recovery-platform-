-- UK RECOVERY PRODUCTION: ONE READ-ONLY RESULT SET / ONE CSV EXPORT.
-- Run manually ONLY in Production Supabase eosrparfgrycdnykekcn.
-- No INSERT/UPDATE/DELETE/DDL, no changes to access, data, or roles.
-- Rows type=CHECK have passes TRUE/FALSE. REVIEW rows contain definitions for human review;
-- passes=NULL is NOT a PASS. Do not upload secret data or credentials.
WITH checks AS (
SELECT 'profiles id uuid' AS check_name, EXISTS (
 SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='id' AND udt_name='uuid'
) AS passes
UNION ALL SELECT 'customer admin role enum', (
 SELECT COUNT(DISTINCT e.enumlabel)=2 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid
 JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='user_role' AND e.enumlabel IN ('customer','admin')
)
UNION ALL SELECT 'jobs customer_id uuid', EXISTS(
 SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='recovery_jobs' AND column_name='customer_id' AND udt_name='uuid')
UNION ALL SELECT 'jobs required API columns',(
 SELECT COUNT(DISTINCT column_name)=7 FROM information_schema.columns WHERE table_schema='public' AND table_name='recovery_jobs'
 AND column_name IN ('id','customer_id','recovery_type','pickup_postcode','status','guest_reference','request_fingerprint'))
UNION ALL SELECT 'private contacts required columns',(
 SELECT COUNT(DISTINCT column_name)=4 FROM information_schema.columns WHERE table_schema='public'
 AND table_name='recovery_job_private_contacts' AND column_name IN ('job_id','full_name','phone','email'))
UNION ALL SELECT 'rate limit required columns',(
 SELECT COUNT(DISTINCT column_name)=2 FROM information_schema.columns WHERE table_schema='public'
 AND table_name='recovery_request_rate_limits' AND column_name IN ('client_hash','created_at'))
UNION ALL SELECT 'rate-limit function signature',to_regprocedure('public.allow_recovery_request(text)') IS NOT NULL
UNION ALL SELECT 'rate-limit function invoker',EXISTS(
 SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='allow_recovery_request' AND p.pronargs=1 AND NOT p.prosecdef)
UNION ALL SELECT 'jobs RLS enabled',EXISTS(
 SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname='recovery_jobs' AND c.relrowsecurity)
UNION ALL SELECT 'private contacts RLS enabled',EXISTS(
 SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname='recovery_job_private_contacts' AND c.relrowsecurity)
UNION ALL SELECT 'rate limit RLS enabled',EXISTS(
 SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname='recovery_request_rate_limits' AND c.relrowsecurity)
UNION ALL SELECT 'no anonymous direct job insert',NOT has_table_privilege('anon','public.recovery_jobs','INSERT')
UNION ALL SELECT 'no authenticated direct job insert',NOT has_table_privilege('authenticated','public.recovery_jobs','INSERT')
UNION ALL SELECT 'no anonymous private contacts read',NOT has_table_privilege('anon','public.recovery_job_private_contacts','SELECT')
UNION ALL SELECT 'no authenticated private contacts read',NOT has_table_privilege('authenticated','public.recovery_job_private_contacts','SELECT')
UNION ALL SELECT 'service role jobs insert',has_table_privilege('service_role','public.recovery_jobs','INSERT')
UNION ALL SELECT 'service role contacts insert',has_table_privilege('service_role','public.recovery_job_private_contacts','INSERT')
UNION ALL SELECT 'service role rate limit select',has_table_privilege('service_role','public.recovery_request_rate_limits','SELECT')
UNION ALL SELECT 'service role rate limit insert',has_table_privilege('service_role','public.recovery_request_rate_limits','INSERT')
UNION ALL SELECT 'service role rate limit sequence usage',has_sequence_privilege('service_role','public.recovery_request_rate_limits_id_seq','USAGE')
UNION ALL SELECT 'service role rate limit execute',has_function_privilege('service_role','public.allow_recovery_request(text)','EXECUTE')
UNION ALL SELECT 'authenticated no rate limit execute',NOT has_function_privilege('authenticated','public.allow_recovery_request(text)','EXECUTE')
UNION ALL SELECT 'service role jobs select',has_table_privilege('service_role','public.recovery_jobs','SELECT')
UNION ALL SELECT 'service role jobs delete',has_table_privilege('service_role','public.recovery_jobs','DELETE')
UNION ALL SELECT 'service role contacts select',has_table_privilege('service_role','public.recovery_job_private_contacts','SELECT')
UNION ALL SELECT 'service role contacts delete',has_table_privilege('service_role','public.recovery_job_private_contacts','DELETE')
UNION ALL SELECT 'authenticated jobs select',has_table_privilege('authenticated','public.recovery_jobs','SELECT')
UNION ALL SELECT 'authenticated profiles select',has_table_privilege('authenticated','public.profiles','SELECT')
UNION ALL SELECT 'anon contacts insert denied',NOT has_table_privilege('anon','public.recovery_job_private_contacts','INSERT')
UNION ALL SELECT 'authenticated contacts insert denied',NOT has_table_privilege('authenticated','public.recovery_job_private_contacts','INSERT')
UNION ALL SELECT 'anon contacts delete denied',NOT has_table_privilege('anon','public.recovery_job_private_contacts','DELETE')
UNION ALL SELECT 'authenticated contacts delete denied',NOT has_table_privilege('authenticated','public.recovery_job_private_contacts','DELETE')
UNION ALL SELECT 'anon rate-limit execute denied',NOT has_function_privilege('anon','public.allow_recovery_request(text)','EXECUTE')
UNION ALL SELECT 'signup function SECURITY DEFINER', EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='create_customer_profile_on_signup' AND p.prosecdef)
UNION ALL SELECT 'signup function flow guard', EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='create_customer_profile_on_signup' AND pg_get_functiondef(p.oid) LIKE '%customer_public_v1%')
UNION ALL SELECT 'signup trigger enabled',EXISTS(
 SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
 JOIN pg_namespace n ON n.oid=p.pronamespace WHERE t.tgrelid='auth.users'::regclass
 AND t.tgname='on_auth_user_created_customer' AND t.tgenabled='O' AND NOT t.tgisinternal
 AND n.nspname='public' AND p.proname='create_customer_profile_on_signup')
),
report AS (
 SELECT 'CHECK'::text AS row_type,check_name,passes,NULL::text AS details FROM checks
 UNION ALL
 SELECT 'REVIEW','rls policy: '||tablename||' / '||policyname,NULL::boolean,
  jsonb_build_object('roles',roles,'cmd',cmd,'using',qual,'with_check',with_check)::text
 FROM pg_policies WHERE schemaname='public'
 AND tablename IN ('profiles','recovery_jobs','recovery_job_private_contacts','recovery_request_rate_limits')
 UNION ALL
 SELECT 'REVIEW','rls table: '||c.relname,NULL::boolean,
  jsonb_build_object('rls_enabled',c.relrowsecurity,'force_rls',c.relforcerowsecurity)::text
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN ('profiles','recovery_jobs','recovery_job_private_contacts','recovery_request_rate_limits')
 UNION ALL
 SELECT 'REVIEW','auth trigger: '||t.tgname,NULL::boolean,
  jsonb_build_object('enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid))::text
 FROM pg_trigger t WHERE t.tgrelid='auth.users'::regclass AND NOT t.tgisinternal
 UNION ALL
 SELECT 'REVIEW','function: '||p.proname,NULL::boolean,
  jsonb_build_object('security_definer',p.prosecdef,'config',p.proconfig,
   'definition',pg_get_functiondef(p.oid))::text
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public'
 AND p.proname IN ('allow_recovery_request','create_customer_profile_on_signup')
)
SELECT row_type,check_name,passes,details FROM report
ORDER BY CASE WHEN row_type='CHECK' THEN 0 ELSE 1 END,check_name;
