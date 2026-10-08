-- Separate Draft PR #10. Apply ONLY to a disposable test project after reviewing prior migrations.
create table if not exists public.driver_memberships (
 driver_id uuid primary key references public.driver_profiles(id) on delete cascade,
 status text not null default 'inactive' check (status in ('inactive','active','past_due','cancelled')),
 valid_until timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.driver_memberships enable row level security;
revoke all on public.driver_memberships from anon;
create policy "driver reads own membership" on public.driver_memberships for select to authenticated using (driver_id=auth.uid() or public.current_user_role()='admin');
create policy "admin manages membership" on public.driver_memberships for all to authenticated using (public.current_user_role()='admin') with check (public.current_user_role()='admin');
alter table public.driver_job_offers add column if not exists eta_minutes integer check (eta_minutes between 1 and 1440);
alter table public.driver_job_offers alter column offer_amount_gbp set not null;
alter table public.driver_job_offers add constraint offer_price_positive check (offer_amount_gbp>0);
drop policy if exists "approved driver create offer" on public.driver_job_offers;
create policy "verified active member creates offer" on public.driver_job_offers for insert to authenticated
with check (driver_id=auth.uid() and public.current_user_role()='driver'
 and exists(select 1 from public.driver_profiles dp where dp.id=auth.uid() and dp.approval_status='approved')
 and exists(select 1 from public.driver_memberships dm where dm.driver_id=auth.uid() and dm.status='active' and dm.valid_until>now())
 and exists(select 1 from public.recovery_jobs j where j.id=job_id and j.status in ('submitted','matching','offered') and j.assigned_driver_id is null));
drop policy if exists "driver update own offer" on public.driver_job_offers;
-- Driver cannot change a submitted offer or assignment state directly.
drop policy if exists "driver offers read own" on public.driver_job_offers;
create policy "offers read by owner or customer" on public.driver_job_offers for select to authenticated
using (driver_id=auth.uid() or public.current_user_role()='admin' or exists(select 1 from public.recovery_jobs j where j.id=job_id and j.customer_id=auth.uid()));
create or replace function public.accept_customer_offer(p_offer_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare selected public.driver_job_offers%rowtype; current_job public.recovery_jobs%rowtype;
begin
 select * into selected from public.driver_job_offers where id=p_offer_id;
 if not found then return false; end if;
 select * into current_job from public.recovery_jobs where id=selected.job_id for update;
 if not found or current_job.customer_id<>auth.uid() or current_job.status not in ('submitted','matching','offered') or current_job.assigned_driver_id is not null or selected.status<>'pending' then return false; end if;
 if not exists(select 1 from public.driver_profiles dp join public.driver_memberships dm on dm.driver_id=dp.id where dp.id=selected.driver_id and dp.approval_status='approved' and dm.status='active' and dm.valid_until>now()) then return false; end if;
 update public.recovery_jobs set assigned_driver_id=selected.driver_id,status='assigned',updated_at=now() where id=current_job.id;
 update public.driver_job_offers set status=case when id=selected.id then 'accepted' else 'declined' end,updated_at=now() where job_id=current_job.id and status='pending';
 return true;
end $$;
revoke all on function public.accept_customer_offer(uuid) from public,anon;
grant execute on function public.accept_customer_offer(uuid) to authenticated;

-- Serialize offers against customer acceptance to close the insert/accept race.
create or replace function public.guard_new_driver_offer()
returns trigger language plpgsql security definer set search_path=public as $$
declare j public.recovery_jobs%rowtype;
begin
 select * into j from public.recovery_jobs where id=new.job_id for update;
 if not found or j.status not in ('submitted','matching','offered') or j.assigned_driver_id is not null then raise exception 'Job no longer accepting offers'; end if;
 if not exists(select 1 from public.driver_profiles dp join public.driver_memberships dm on dm.driver_id=dp.id where dp.id=new.driver_id and dp.approval_status='approved' and dm.status='active' and dm.valid_until>now()) then raise exception 'Driver not eligible'; end if;
 return new;
end $$;
drop trigger if exists guard_new_driver_offer_trigger on public.driver_job_offers;
create trigger guard_new_driver_offer_trigger before insert on public.driver_job_offers for each row execute function public.guard_new_driver_offer();
