-- Guest recovery jobs: retain RLS; private contact data never appears in recovery_jobs.
alter table public.recovery_jobs alter column customer_id drop not null;
alter table public.recovery_jobs add column if not exists guest_reference text unique;
alter table public.recovery_jobs add column if not exists request_fingerprint text unique;
create table if not exists public.recovery_job_private_contacts (
 job_id uuid primary key references public.recovery_jobs(id) on delete cascade,
 full_name text not null,
 phone text not null,
 email text not null,
 created_at timestamptz not null default now()
);
alter table public.recovery_job_private_contacts enable row level security;
-- No public/authenticated policy: only trusted server service-role and explicit future admin RPCs can access contact details.
revoke all on public.recovery_job_private_contacts from anon, authenticated;
create index if not exists recovery_jobs_guest_reference_idx on public.recovery_jobs(guest_reference);
