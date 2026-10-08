create table if not exists public.recovery_request_rate_limits (
 id bigint generated always as identity primary key,
 client_hash text not null,
 created_at timestamptz not null default now()
);
create index if not exists recovery_request_rate_limits_lookup on public.recovery_request_rate_limits(client_hash,created_at);
alter table public.recovery_request_rate_limits enable row level security;
revoke all on public.recovery_request_rate_limits from anon,authenticated;
create or replace function public.allow_recovery_request(p_client_hash text)
returns boolean language plpgsql security invoker set search_path=public as $$
declare recent_count integer;
begin
 if length(p_client_hash)<>64 then return false; end if;
 perform pg_advisory_xact_lock(hashtext(p_client_hash));
 select count(*) into recent_count from public.recovery_request_rate_limits
 where client_hash=p_client_hash and created_at>now()-interval '1 hour';
 if recent_count>=5 then return false; end if;
 insert into public.recovery_request_rate_limits(client_hash) values(p_client_hash);
 return true;
end $$;
revoke all on function public.allow_recovery_request(text) from public,anon,authenticated;
grant execute on function public.allow_recovery_request(text) to service_role;
