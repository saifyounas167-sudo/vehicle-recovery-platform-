-- Auth and Row Level Security for the marketplace.
-- Authorization is enforced in the database as well as in application routes.

alter table profiles enable row level security;
alter table driver_profiles enable row level security;
alter table recovery_jobs enable row level security;
alter table driver_job_offers enable row level security;
alter table pricing_rules enable row level security;

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "profiles self read" on profiles for select using (id = auth.uid());
create policy "profiles self update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "approved driver profile read" on driver_profiles for select
using (id = auth.uid() or (public.current_user_role() = 'admin'));
create policy "driver self update" on driver_profiles for update
using (id = auth.uid()) with check (id = auth.uid());

create policy "customer jobs read own" on recovery_jobs for select
using (customer_id = auth.uid() or assigned_driver_id = auth.uid() or public.current_user_role() = 'admin');

create policy "customer create own job" on recovery_jobs for insert
with check (customer_id = auth.uid() and public.current_user_role() = 'customer');

create policy "customer update own draft/submitted job" on recovery_jobs for update
using (customer_id = auth.uid() and status in ('draft','submitted'))
with check (customer_id = auth.uid());

create policy "driver read eligible marketplace jobs" on recovery_jobs for select
using (
  public.current_user_role() = 'driver'
  and exists (
    select 1 from driver_profiles dp
    where dp.id = auth.uid() and dp.approval_status = 'approved'
  )
  and status in ('submitted','matching','offered')
);

create policy "driver offers read own" on driver_job_offers for select using (driver_id = auth.uid() or public.current_user_role() = 'admin');
create policy "approved driver create offer" on driver_job_offers for insert
with check (
  driver_id = auth.uid()
  and public.current_user_role() = 'driver'
  and exists (select 1 from driver_profiles dp where dp.id = auth.uid() and dp.approval_status = 'approved')
);
create policy "driver update own offer" on driver_job_offers for update
using (driver_id = auth.uid()) with check (driver_id = auth.uid());

create policy "admin pricing access" on pricing_rules for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

-- Keep the marketplace matching rules configurable. Eligibility is intentionally not encoded
-- beyond the approved-driver requirement; service/coverage matching remains a future service layer.
