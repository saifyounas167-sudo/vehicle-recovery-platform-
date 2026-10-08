-- Guard offer creation against already-assigned jobs.
drop policy if exists "approved driver create offer" on public.driver_job_offers;
create policy "approved driver create offer" on public.driver_job_offers for insert
with check (
 driver_id=auth.uid() and public.current_user_role()='driver'
 and exists(select 1 from public.driver_profiles dp where dp.id=auth.uid() and dp.approval_status='approved')
 and exists(select 1 from public.recovery_jobs j where j.id=job_id and j.status in ('submitted','matching','offered') and j.assigned_driver_id is null)
);
-- Guest offer acceptance must be atomic, and only a verified job owner can invoke it.
-- Service role is the only caller; the HTTP endpoint validates the guest capability.
create or replace function public.accept_guest_recovery_offer(p_job_id uuid,p_offer_id uuid)
returns boolean language plpgsql security invoker set search_path=public as $$
declare v_driver uuid;
begin
 select driver_id into v_driver from public.driver_job_offers
 where id=p_offer_id and job_id=p_job_id and status='pending' for update;
 if v_driver is null then return false; end if;
 update public.recovery_jobs set assigned_driver_id=v_driver,status='assigned',updated_at=now()
 where id=p_job_id and assigned_driver_id is null and status in ('submitted','matching','offered');
 if not found then return false; end if;
 update public.driver_job_offers set status=case when id=p_offer_id then 'accepted' else 'rejected' end,updated_at=now()
 where job_id=p_job_id and status='pending';
 return true;
end $$;
revoke all on function public.accept_guest_recovery_offer(uuid,uuid) from public,anon,authenticated;
grant execute on function public.accept_guest_recovery_offer(uuid,uuid) to service_role;
