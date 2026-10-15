-- Isolated staging only. Prepared notification outbox; NO external messages sent.
-- Run only after 0013 and full RLS acceptance in authorised staging.
create table if not exists public.marketplace_notification_preferences(
 user_id uuid primary key references public.profiles(id) on delete cascade,
 in_app boolean not null default true,
 web_push boolean not null default false,
 email boolean not null default false,
 sms boolean not null default false,
 sound boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.marketplace_notification_preferences enable row level security;
create policy "self notifications preferences read" on public.marketplace_notification_preferences
 for select to authenticated using(user_id=auth.uid());
create policy "self notifications preferences insert" on public.marketplace_notification_preferences
 for insert to authenticated with check(user_id=auth.uid());
create policy "self notifications preferences update" on public.marketplace_notification_preferences
 for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create table if not exists public.marketplace_notification_outbox(
 id uuid primary key default gen_random_uuid(),
 event_type text not null check(event_type in ('nearby_job','driver_offer','offer_accepted','job_status')),
 job_id uuid references public.recovery_jobs(id) on delete cascade,
 offer_id uuid references public.driver_job_offers(id) on delete cascade,
 recipient_user_id uuid references public.profiles(id) on delete cascade,
 recipient_guest_job uuid references public.recovery_jobs(id) on delete cascade,
 created_at timestamptz not null default now(),
 processed_at timestamptz,
 unique(event_type,job_id,offer_id,recipient_user_id),
 check ((recipient_user_id is not null) <> (recipient_guest_job is not null))
);
alter table public.marketplace_notification_outbox enable row level security;
revoke all on public.marketplace_notification_outbox from anon,authenticated;
-- Only service-role outbound workers may read/mark delivered. No worker is
-- installed in this change; email/SMS/web-push are DISABLED in Production.

create or replace function public.queue_marketplace_job_notifications()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status not in ('submitted','matching','offered') then return new;end if;
 insert into public.marketplace_notification_outbox(event_type,job_id,recipient_user_id)
 select 'nearby_job',new.id,d.id from public.driver_profiles d
 where public.eligible_driver_for_job(d.id,new.id)
 on conflict do nothing;
 return new;
end $$;
drop trigger if exists queue_marketplace_jobs on public.recovery_jobs;
create trigger queue_marketplace_jobs after insert on public.recovery_jobs
 for each row execute function public.queue_marketplace_job_notifications();

create or replace function public.queue_marketplace_offer_notifications()
returns trigger language plpgsql security definer set search_path=public as $$
declare customer uuid;
begin
 select customer_id into customer from public.recovery_jobs where id=new.job_id;
 if customer is not null then
  insert into public.marketplace_notification_outbox(event_type,job_id,offer_id,recipient_user_id)
  values('driver_offer',new.job_id,new.id,customer) on conflict do nothing;
 else
  insert into public.marketplace_notification_outbox(event_type,job_id,offer_id,recipient_guest_job)
  values('driver_offer',new.job_id,new.id,new.job_id) on conflict do nothing;
 end if;
 return new;
end $$;
drop trigger if exists queue_marketplace_offers on public.driver_job_offers;
create trigger queue_marketplace_offers after insert on public.driver_job_offers
 for each row execute function public.queue_marketplace_offer_notifications();

-- Future worker must consult per-recipient preferences and explicitly approved
-- providers before delivery. No unsolicited SMS/email is produced by these triggers.
