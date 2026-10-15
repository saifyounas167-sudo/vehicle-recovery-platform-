-- SS4/SS5 dynamic marketplace: apply in AUTHORIZED ISOLATED STAGING ONLY.
-- Depends on 0001-0012; do not apply to Production without commercial launch approval.
-- Driver coverage uses verified postcode-centre geocoordinates (straight-line eligibility,
-- NEVER road mileage for pricing). Null coordinates intentionally match no jobs.
alter table public.driver_profiles
 add column if not exists coverage_postcode text,
 add column if not exists coverage_latitude numeric(10,7),
 add column if not exists coverage_longitude numeric(10,7),
 add column if not exists availability text not null default 'offline',
 add column if not exists vehicle_capabilities text[] not null default '{}',
 add column if not exists about text;

alter table public.driver_profiles drop constraint if exists driver_availability_valid;
alter table public.driver_profiles add constraint driver_availability_valid
 check (availability in ('available','busy','offline'));
alter table public.driver_profiles drop constraint if exists driver_radius_reasonable;
alter table public.driver_profiles add constraint driver_radius_reasonable
 check (coverage_radius_miles is null or (coverage_radius_miles > 0 and coverage_radius_miles <= 300));
alter table public.driver_profiles drop constraint if exists driver_coords_pair;
alter table public.driver_profiles add constraint driver_coords_pair check (
 (coverage_latitude is null and coverage_longitude is null) or
 (coverage_latitude is not null and coverage_longitude is not null and coverage_latitude between 49 and 61 and coverage_longitude between -9 and 3)
);

create table if not exists public.driver_verification_documents (
 id uuid primary key default gen_random_uuid(),
 driver_id uuid not null references public.driver_profiles(id) on delete cascade,
 storage_path text not null,
 document_type text not null check(document_type in ('insurance','driving_licence','business','other')),
 created_at timestamptz not null default now()
);
alter table public.driver_verification_documents enable row level security;
revoke all on public.driver_verification_documents from anon,authenticated;
-- Documents and insurance records are accessed via authenticated server endpoints ONLY.
-- Private storage bucket policies must be configured and verified in isolated staging.

-- Geographic eligibility: use postcode-centre distance for COVERAGE ONLY, not pricing.
create or replace function public.coverage_distance_miles(a_lat numeric,a_lon numeric,b_lat numeric,b_lon numeric)
returns double precision language sql immutable strict set search_path=public as $$
 select 3958.7613 * 2 * asin(sqrt(
   power(sin(radians((a_lat::double precision-b_lat::double precision)/2)),2)
   + cos(radians(a_lat::double precision))*cos(radians(b_lat::double precision))
   * power(sin(radians((a_lon::double precision-b_lon::double precision)/2)),2)
 ))
$$;
create or replace function public.eligible_driver_for_job(p_driver_id uuid,p_job_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(
  select 1 from public.driver_profiles d
  join public.recovery_jobs j on j.id=p_job_id
  join public.driver_memberships m on m.driver_id=d.id
  where d.id=p_driver_id and d.approval_status='approved'
   and d.availability='available'
   and m.status='active' and m.valid_until>now()
   and j.status in ('submitted','matching','offered')
   and j.assigned_driver_id is null
   and j.recovery_type=any(d.services)
   and (j.vehicle_type is null or j.vehicle_type=any(d.vehicle_capabilities))
   and d.coverage_radius_miles>0
   and d.coverage_latitude is not null and d.coverage_longitude is not null
   and j.pickup_latitude is not null and j.pickup_longitude is not null
   and public.coverage_distance_miles(d.coverage_latitude,d.coverage_longitude,j.pickup_latitude,j.pickup_longitude) <= d.coverage_radius_miles
 )
$$;
revoke all on function public.eligible_driver_for_job(uuid,uuid) from public,anon;
grant execute on function public.eligible_driver_for_job(uuid,uuid) to authenticated,service_role;

-- Existing wide driver read policy MUST be replaced before opening staging job access.
drop policy if exists "driver read eligible marketplace jobs" on public.recovery_jobs;
create policy "driver read coverage matched jobs" on public.recovery_jobs for select to authenticated
 using(public.current_user_role()='driver' and public.eligible_driver_for_job(auth.uid(),id));

drop policy if exists "verified active member creates offer" on public.driver_job_offers;
create policy "eligible verified member creates offer" on public.driver_job_offers for insert to authenticated
 with check(
  driver_id=auth.uid() and public.current_user_role()='driver'
  and public.eligible_driver_for_job(auth.uid(),job_id)
 );

-- Protect direct writes against bypass of offer RLS through privileged API contexts.
create or replace function public.guard_new_driver_offer()
returns trigger language plpgsql security definer set search_path=public as $$
declare j public.recovery_jobs%rowtype;
begin
 select * into j from public.recovery_jobs where id=new.job_id for update;
 if not found or j.status not in ('submitted','matching','offered') or j.assigned_driver_id is not null
  then raise exception 'Job no longer accepting offers';end if;
 if not public.eligible_driver_for_job(new.driver_id,new.job_id)
  then raise exception 'Driver is not eligible for this job';end if;
 return new;
end $$;
-- 0009 trigger keeps pointing at this replaced function.

-- An existing offer cannot be accepted after coverage/availability is lost.
-- Keep 0010 atomic offer acceptance until a separately reviewed transaction migration
-- adds the above eligibility check to the acceptance RPC.

-- Documents must never be available via public Storage URLs.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('driver-verification-private','driver-verification-private',false,5242880,array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['application/pdf','image/jpeg','image/png'];

-- Harden existing broad self-update policy from 0002: authenticated drivers may
-- change availability but cannot silently alter approved identity, capabilities
-- or verified geocoordinates. Server-side service-role updates remain possible.
create or replace function public.guard_driver_sensitive_fields()
returns trigger language plpgsql set search_path=public as $$
begin
 if auth.uid() is not null and public.current_user_role()<>'admin' then
  if (to_jsonb(new)-'availability'-'updated_at') is distinct from
     (to_jsonb(old)-'availability'-'updated_at') then
   raise exception 'Driver profile changes require server verification';
  end if;
  if new.availability='available' and old.approval_status<>'approved' then
   raise exception 'Driver must be approved before becoming available';
  end if;
 end if;
 return new;
end $$;
drop trigger if exists guard_driver_sensitive_fields_trigger on public.driver_profiles;
create trigger guard_driver_sensitive_fields_trigger
 before update on public.driver_profiles for each row execute function public.guard_driver_sensitive_fields();

-- Preserve atomic guest manual acceptance from 0010 while checking the driver
-- remains eligible at acceptance time. Job row is locked before the offer.
create or replace function public.accept_guest_recovery_offer(p_job_id uuid,p_offer_id uuid)
returns boolean language plpgsql security invoker set search_path=public as $$
declare selected public.driver_job_offers%rowtype; current_job public.recovery_jobs%rowtype;
begin
 select * into current_job from public.recovery_jobs where id=p_job_id for update;
 if not found or current_job.status not in ('submitted','matching','offered') or current_job.assigned_driver_id is not null then return false;end if;
 select * into selected from public.driver_job_offers
 where id=p_offer_id and job_id=p_job_id and status='pending' for update;
 if not found or not public.eligible_driver_for_job(selected.driver_id,p_job_id) then return false;end if;
 update public.recovery_jobs set assigned_driver_id=selected.driver_id,status='assigned',updated_at=now()
 where id=p_job_id and assigned_driver_id is null and status in ('submitted','matching','offered');
 if not found then return false;end if;
 update public.driver_job_offers set status=case when id=selected.id then 'accepted' else 'rejected' end,updated_at=now()
 where job_id=p_job_id and status='pending';
 return true;
end $$;
revoke all on function public.accept_guest_recovery_offer(uuid,uuid) from public,anon,authenticated;
grant execute on function public.accept_guest_recovery_offer(uuid,uuid) to service_role;

-- Existing authenticated customer acceptance is also guarded by the same eligibility.
create or replace function public.accept_customer_offer(p_offer_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare selected public.driver_job_offers%rowtype; current_job public.recovery_jobs%rowtype;
begin
 select * into selected from public.driver_job_offers where id=p_offer_id;
 if not found then return false;end if;
 select * into current_job from public.recovery_jobs where id=selected.job_id for update;
 if not found or current_job.customer_id is distinct from auth.uid() or current_job.status not in ('submitted','matching','offered') or current_job.assigned_driver_id is not null or selected.status<>'pending' then return false;end if;
 if not public.eligible_driver_for_job(selected.driver_id,current_job.id) then return false;end if;
 update public.recovery_jobs set assigned_driver_id=selected.driver_id,status='assigned',updated_at=now() where id=current_job.id;
 update public.driver_job_offers set status=case when id=selected.id then 'accepted' else 'rejected' end,updated_at=now() where job_id=current_job.id and status='pending';
 return true;
end $$;
revoke all on function public.accept_customer_offer(uuid) from public,anon;
grant execute on function public.accept_customer_offer(uuid) to authenticated;
