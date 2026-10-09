-- PR #11 test database repair, STAGE 2 of 2.
-- Use ONLY after stage 1 succeeds in vehicle-recovery-test.
-- Replaces the pre-existing guest acceptance RPC with locked membership verification.
-- No changes to guest proof validation, pricing, jobs, or production.
begin;
do $guard$
begin
 if to_regclass('public.driver_memberships') is null
    or to_regprocedure('public.accept_guest_recovery_offer(uuid,uuid)') is null
    or not exists(select 1 from pg_trigger where tgrelid='public.driver_job_offers'::regclass and tgname='guard_new_driver_offer_trigger' and not tgisinternal)
 then
   raise exception 'Stage 1 is incomplete; guest acceptance was NOT changed.';
 end if;
end $guard$;

create or replace function public.accept_guest_recovery_offer(p_job_id uuid,p_offer_id uuid)
returns boolean language plpgsql security invoker set search_path=public as $fn$
declare
 selected public.driver_job_offers%rowtype;
 current_job public.recovery_jobs%rowtype;
begin
 -- HTTP endpoint has already authenticated guest capability (job, reference, proof).
 -- Serialize against insert trigger and authenticated customer acceptance.
 select * into current_job from public.recovery_jobs where id=p_job_id for update;
 if not found or current_job.status not in ('submitted','matching','offered')
    or current_job.assigned_driver_id is not null then return false; end if;
 select * into selected from public.driver_job_offers
 where id=p_offer_id and job_id=p_job_id and status='pending' for update;
 if not found then return false; end if;
 if not exists (
  select 1 from public.driver_profiles dp
  join public.driver_memberships dm on dm.driver_id=dp.id
  where dp.id=selected.driver_id and dp.approval_status='approved'
    and dm.status='active' and dm.valid_until>now()
 ) then return false; end if;
 update public.recovery_jobs
 set assigned_driver_id=selected.driver_id,status='assigned',updated_at=now()
 where id=p_job_id and assigned_driver_id is null
   and status in ('submitted','matching','offered');
 if not found then return false; end if;
 update public.driver_job_offers
 set status=case when id=selected.id then 'accepted' else 'rejected' end,
     updated_at=now()
 where job_id=p_job_id and status='pending';
 return true;
end $fn$;
revoke all on function public.accept_guest_recovery_offer(uuid,uuid) from public,anon,authenticated;
grant execute on function public.accept_guest_recovery_offer(uuid,uuid) to service_role;
notify pgrst, 'reload schema';
commit;
