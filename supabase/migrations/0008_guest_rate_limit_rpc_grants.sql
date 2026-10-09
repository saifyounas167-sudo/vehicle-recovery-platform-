-- 0008: repair RPC execution grants for the already-applied guest rate limiter.
-- Do NOT edit/reapply 0006. This migration is additive and idempotent.
-- SECURITY INVOKER is intentional: the caller must have the required privileges.
grant usage on schema public to service_role;
grant select, insert on table public.recovery_request_rate_limits to service_role;
grant usage, select on sequence public.recovery_request_rate_limits_id_seq to service_role;
grant execute on function public.allow_recovery_request(text) to service_role;
revoke all on function public.allow_recovery_request(text) from public, anon, authenticated;
revoke all on table public.recovery_request_rate_limits from anon, authenticated;
revoke all on sequence public.recovery_request_rate_limits_id_seq from anon, authenticated;
alter table public.recovery_request_rate_limits enable row level security;
-- PostgREST may still cache an old RPC signature after SQL Editor migrations.
notify pgrst, 'reload schema';
