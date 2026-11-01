-- UK RECOVERY — STAGING ONLY: repair rate-limit RPC invoker permissions.
-- Apply manually ONLY in Supabase project ozphvosiqbzvkthlppkd after reviewing.
-- Never apply to Production. Does not disable RLS or broaden anon/authenticated grants.
BEGIN;
DO $verify$
BEGIN
 IF to_regclass('public.recovery_request_rate_limits') IS NULL
    OR to_regprocedure('public.allow_recovery_request(text)') IS NULL
 THEN RAISE EXCEPTION 'Milestone rate-limit prerequisites missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='allow_recovery_request'
  AND p.pronargs=1 AND NOT p.prosecdef)
 THEN RAISE EXCEPTION 'Rate-limit function security mode has changed'; END IF;
END $verify$;
GRANT SELECT, INSERT ON TABLE public.recovery_request_rate_limits TO service_role;
GRANT USAGE ON SEQUENCE public.recovery_request_rate_limits_id_seq TO service_role;
-- Keep the endpoint's invocation restricted to its existing service_role grant.
REVOKE ALL ON TABLE public.recovery_request_rate_limits FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.allow_recovery_request(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.allow_recovery_request(text) TO service_role;
COMMIT;
