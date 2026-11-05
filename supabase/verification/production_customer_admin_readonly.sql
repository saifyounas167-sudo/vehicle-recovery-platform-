-- READ-ONLY production readiness check; no SQL changes.
-- Run ONLY in Production SQL Editor eosrparfgrycdnykekcn.
-- Inspect every result. This script never modifies data, triggers or privileges.
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
UNION ALL SELECT 'signup trigger enabled',EXISTS(
 SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
 JOIN pg_namespace n ON n.oid=p.pronamespace WHERE t.tgrelid='auth.users'::regclass
 AND t.tgname='on_auth_user_created_customer' AND t.tgenabled='O' AND NOT t.tgisinternal
 AND n.nspname='public' AND p.proname='create_customer_profile_on_signup')
ORDER BY check_name;

-- Review exact RLS policy predicates and live trigger definitions manually.
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname='public' AND tablename IN
('profiles','recovery_jobs','recovery_job_private_contacts','recovery_request_rate_limits')
ORDER BY tablename,policyname;
SELECT t.tgname,t.tgenabled,pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t WHERE t.tgrelid='auth.users'::regclass AND NOT t.tgisinternal;
SELECT p.proname,p.prosecdef,p.proconfig,pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('allow_recovery_request','create_customer_profile_on_signup');
