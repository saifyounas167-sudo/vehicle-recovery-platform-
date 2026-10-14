-- Staging-only candidate for approved service-specific guest estimate contract.
-- Backward compatible: existing email data is preserved; making it nullable allows guests
-- to omit an email. Private contact RLS, grants and existing primary key are untouched.
-- Never apply to production without a separate explicit release approval.
alter table public.recovery_job_private_contacts
  alter column email drop not null;
-- Migration 0011 already allows NULL passenger_count and checks supplied values are 0..8.
-- The original recovery_jobs make/model, transmission, condition and accident columns
-- are nullable. Keep optional data as NULL, never fake a value.
