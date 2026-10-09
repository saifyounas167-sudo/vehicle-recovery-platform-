-- PR #11 test database repair, STAGE 1 of 2.
-- Run ONLY in Supabase project vehicle-recovery-test, as the SQL Editor owner.
-- Do NOT rerun 0009 blindly, do NOT apply this to production.
-- Keeps existing jobs/offers/ETA data; no test prices or public access changes.
-- Atomic: errors roll back all changes.
begin;

do $guard$
begin
 if to_regclass('public.driver_profiles') is null
    or to_regclass('public.profiles') is null
    or to_regclass('public.recovery_jobs') is null
    or to_regclass('public.driver_job_offers') is null
    or to_regprocedure('public.current_user_role()') is null then
   raise exception 'Required 0001-0008 foundation missing. No repair applied.';
 end if;
 if exists (
  select 1 from information_schema.columns
  where table_schema='public' and table_name='driver_job_offers'
    and column_name='eta_minutes' and data_type <> 'integer'
 ) then
   raise exception 'Unexpected eta_minutes type. No repair applied.';
 end if;
end $guard$;

-- 0009 was not installed: create only the missing membership structure.
create table if not exists public.driver_memberships (
 driver_id uuid primary key references public.driver_profiles(id) on delete cascade,
 status text not null default 'inactive'
  check (status in ('inactive','active','past_due','cancelled')),
 valid_until timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.driver_memberships enable row level security;
revoke all on table public.driver_memberships from anon;

-- Replace named policies with secure, known definitions. These are DDL only.
drop policy if exists "driver reads own membership" on public.driver_memberships;
create policy "driver reads own membership" on public.driver_memberships
 for select to authenticated
 using (driver_id=auth.uid() or public.current_user_role()='admin');
drop policy if exists "admin manages membership" on public.driver_memberships;
create policy "admin manages membership" on public.driver_memberships
 for all to authenticated
 using (public.current_user_role()='admin')
 with check (public.current_user_role()='admin');

-- ETA already exists in the audit: do not delete or rewrite data.
alter table public.driver_job_offers add column if not exists eta_minutes integer;
do $constraint$
begin
 if not exists (
  select 1 from pg_constraint
  where conrelid='public.driver_job_offers'::regclass
    and conname='pr11_offer_price_positive'
 ) then
   alter table public.driver_job_offers
    add constraint pr11_offer_price_positive
    check (offer_amount_gbp is not null and offer_amount_gbp>0) not valid;
 end if;
 if not exists (
  select 1 from pg_constraint
  where conrelid='public.driver_job_offers'::regclass
    and conname='pr11_offer_eta_range'
 ) then
   alter table public.driver_job_offers
    add constraint pr11_offer_eta_range
    check (eta_minutes is null or eta_minutes between 1 and 1440) not valid;
 end if;
end $constraint$;

-- Remove the known old permissive policies before installing membership gate.
drop policy if exists "approved driver create offer" on public.driver_job_offers;
drop policy if exists "verified active member creates offer" on public.driver_job_offers;
create policy "verified active member creates offer" on public.driver_job_offers
 for insert to authenticated with check (
  driver_id=auth.uid()
  and public.current_user_role()='driver'
  and exists (
   select 1 from public.driver_profiles dp
   where dp.id=auth.uid() and dp.approval_status='approved'
  )
  and exists (
   select 1 from public.driver_memberships dm
   where dm.driver_id=auth.uid()
     and dm.status='active' and dm.valid_until>now()
  )
  and exists (
   select 1 from public.recovery_jobs j
   where j.id=job_id and j.assigned_driver_id is null
     and j.status in ('submitted','matching','offered')
  )
 );
-- Users must not edit offer amount/status themselves after insertion.
drop policy if exists "driver update own offer" on public.driver_job_offers;

drop policy if exists "driver offers read own" on public.driver_job_offers;
drop policy if exists "offers read by owner or customer" on public.driver_job_offers;
create policy "offers read by owner or customer" on public.driver_job_offers
 for select to authenticated using (
  driver_id=auth.uid() or public.current_user_role()='admin'
  or exists (
   select 1 from public.recovery_jobs j
   where j.id=job_id and j.customer_id=auth.uid()
  )
 );

-- Authenticated customer acceptance: customer owns job and selects an
-- approved, currently active member. Lock job before selecting offer.
create or replace function public.accept_customer_offer(p_offer_id uuid)
returns boolean language plpgsql security definer set search_path=public as $fn$
declare
 selected public.driver_job_offers%rowtype;
 current_job public.recovery_jobs%rowtype;
begin
 select job_id into selected.job_id
 from public.driver_job_offers where id=p_offer_id;
 if not found then return false; end if;

 select * into current_job from public.recovery_jobs
 where id=selected.job_id for update;
 if not found or current_job.customer_id is distinct from auth.uid()
    or auth.uid() is null
    or current_job.status not in ('submitted','matching','offered')
    or current_job.assigned_driver_id is not null then return false; end if;

 select * into selected from public.driver_job_offers
 where id=p_offer_id and job_id=current_job.id and status='pending' for update;
 if not found then return false; end if;

 if not exists (
  select 1 from public.driver_profiles dp
  join public.driver_memberships dm on dm.driver_id=dp.id
  where dp.id=selected.driver_id and dp.approval_status='approved'
    and dm.status='active' and dm.valid_until>now()
 ) then return false; end if;

 update public.recovery_jobs
 set assigned_driver_id=selected.driver_id,status='assigned',updated_at=now()
 where id=current_job.id and assigned_driver_id is null
   and status in ('submitted','matching','offered');
 if not found then return false; end if;
 update public.driver_job_offers
 set status=case when id=selected.id then 'accepted' else 'declined' end,
     updated_at=now()
 where job_id=current_job.id and status='pending';
 return true;
end $fn$;
revoke all on function public.accept_customer_offer(uuid) from public,anon;
grant execute on function public.accept_customer_offer(uuid) to authenticated;

-- Lock-before-insert trigger prevents race with customer/guest offer acceptance.
create or replace function public.guard_new_driver_offer()
returns trigger language plpgsql security definer set search_path=public as $fn$
declare job public.recovery_jobs%rowtype;
begin
 select * into job from public.recovery_jobs where id=new.job_id for update;
 if not found or job.status not in ('submitted','matching','offered')
    or job.assigned_driver_id is not null then
   raise exception 'Job no longer accepting offers';
 end if;
 if not exists (
  select 1 from public.driver_profiles dp
  join public.driver_memberships dm on dm.driver_id=dp.id
  where dp.id=new.driver_id and dp.approval_status='approved'
    and dm.status='active' and dm.valid_until>now()
 ) then raise exception 'Driver not eligible'; end if;
 return new;
end $fn$;
drop trigger if exists guard_new_driver_offer_trigger on public.driver_job_offers;
create trigger guard_new_driver_offer_trigger
 before insert on public.driver_job_offers for each row
 execute function public.guard_new_driver_offer();

-- Prevent profile self-role escalation and driver self-approval.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql set search_path=public as $fn$
begin
 if auth.uid() is not null and new.role is distinct from old.role then
  raise exception 'Role changes require privileged administration';
 end if;
 return new;
end $fn$;
drop trigger if exists guard_profile_privileges_trigger on public.profiles;
create trigger guard_profile_privileges_trigger
 before update on public.profiles for each row
 execute function public.guard_profile_privileges();

create or replace function public.guard_driver_approval()
returns trigger language plpgsql set search_path=public as $fn$
begin
 if auth.uid() is not null
    and public.current_user_role() is distinct from 'admin'::public.user_role
    and new.approval_status is distinct from old.approval_status then
  raise exception 'Driver verification requires administrator';
 end if;
 return new;
end $fn$;
drop trigger if exists guard_driver_approval_trigger on public.driver_profiles;
create trigger guard_driver_approval_trigger
 before update on public.driver_profiles for each row
 execute function public.guard_driver_approval();

-- No change to the guest-accept RPC here; that is STAGE 2 after verification.
notify pgrst, 'reload schema';
commit;
