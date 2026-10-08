-- Private optional recovery photos. Only the trusted server may manage these objects.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('recovery-vehicle-photos','recovery-vehicle-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create table if not exists public.recovery_job_photo_access (
 job_id uuid not null references public.recovery_jobs(id) on delete cascade,
 storage_path text not null unique,
 created_at timestamptz not null default now(),
 primary key (job_id,storage_path)
);
alter table public.recovery_job_photo_access enable row level security;
revoke all on public.recovery_job_photo_access from anon,authenticated;
-- No SELECT/INSERT policies on storage.objects for this bucket. Server uses service role only.
