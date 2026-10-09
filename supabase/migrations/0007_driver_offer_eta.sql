-- Driver ETA is required for a meaningful marketplace offer.
alter table public.driver_job_offers add column if not exists eta_minutes integer;
alter table public.driver_job_offers add constraint driver_job_offers_eta_range check (eta_minutes is null or (eta_minutes between 1 and 1440));
-- No membership model is yet deployed. Restrict the offer API until verified active memberships can be enforced.
-- Before production, add a membership entitlement table/policy and remove the application-side fail-closed gate only after tests.
