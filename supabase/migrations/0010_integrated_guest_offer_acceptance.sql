-- Integration-only migration. Apply AFTER 0009 in disposable test DB first.
-- Preserve PR9 guest capability authentication at the HTTP boundary.
-- Preserve PR10 driver membership gate at the database/atomic accept boundary.
create or replace function public.accept_guest_recovery_offer(p_job_id uuid,p_offer_id uuid)
returns boolean language plpgsql security invoker set search_path=public as $$
declare selected public.driver_job_offers%rowtype; current_job public.recovery_jobs%rowtype;
begin
 -- Consistent lock order with guard_new_driver_offer: lock job before offer.
 select * into current_job from public.recovery_jobs where id=p_job_id for update;
 if not found or current_job.status not in ('submitted','matching','offered') or current_job.assigned_driver_id is not null then return false; end if;
 select * into selected from public.driver_job_offers
 where id=p_offer_id and job_id=p_job_id and status='pending' for update;
 if not found then return false; end if;
 if not exists(
   select 1 from public.driver_profiles dp
   join public.driver_memberships dm on dm.driver_id=dp.id
   where dp.id=selected.driver_id
     and dp.approval_status='approved'
     and dm.status='active' and dm.valid_until>now()
 ) then return false; end if;
 update public.recovery_jobs
 set assigned_driver_id=selected.driver_id,status='assigned',updated_at=now()
 where id=p_job_id and assigned_driver_id is null and status in ('submitted','matching','offered');
 if not found then return false; end if;
 update public.driver_job_offers
 set status=case when id=selected.id then 'accepted' else 'rejected' end,updated_at=now()
 where job_id=p_job_id and status='pending';
 return true;
end $$;
revoke all on function public.accept_guest_recovery_offer(uuid,uuid) from public,anon,authenticated;
grant execute on function public.accept_guest_recovery_offer(uuid,uuid) to service_role;
