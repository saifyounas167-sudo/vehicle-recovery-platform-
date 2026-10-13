-- Additive only: passenger count for future guest recovery requests.
alter table public.recovery_jobs add column if not exists passenger_count smallint;
alter table public.recovery_jobs drop constraint if exists recovery_jobs_passenger_count_check;
alter table public.recovery_jobs add constraint recovery_jobs_passenger_count_check check (passenger_count between 0 and 8);
