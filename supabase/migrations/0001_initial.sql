-- Initial database foundation for the UK vehicle recovery marketplace.
-- Keep business rules configurable; do not encode unconfirmed pricing or offer rules here.

create extension if not exists pgcrypto;

create type user_role as enum ('customer', 'driver', 'admin');
create type driver_approval_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type job_status as enum ('draft', 'submitted', 'matching', 'offered', 'assigned', 'in_progress', 'completed', 'cancelled');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table driver_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  company_name text,
  business_address text,
  company_registration_number text,
  experience_years integer,
  truck_type text,
  services text[] not null default '{}',
  coverage_radius_miles numeric(8,2),
  approval_status driver_approval_status not null default 'pending',
  profile_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table recovery_jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id),
  recovery_type text not null,
  pickup_postcode text not null,
  pickup_address text,
  pickup_latitude numeric(10,7),
  pickup_longitude numeric(10,7),
  destination_postcode text,
  destination_address text,
  destination_latitude numeric(10,7),
  destination_longitude numeric(10,7),
  nearest_garage_requested boolean not null default false,
  roadside_assistance_requested boolean not null default false,
  vehicle_registration text,
  vehicle_make text,
  vehicle_model text,
  vehicle_type text,
  transmission text,
  running_status text,
  rolling_status text,
  wheel_condition text,
  accident_status text,
  problem_description text,
  photos text[] not null default '{}',
  is_urgent boolean not null default false,
  preferred_collection_time timestamptz,
  customer_contact_preference text,
  estimated_quote_gbp numeric(10,2),
  status job_status not null default 'submitted',
  assigned_driver_id uuid references driver_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table driver_job_offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references recovery_jobs(id) on delete cascade,
  driver_id uuid not null references driver_profiles(id) on delete cascade,
  offer_amount_gbp numeric(10,2),
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, driver_id)
);

create table pricing_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default false,
  rule_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recovery_jobs_customer_id_idx on recovery_jobs(customer_id);
create index recovery_jobs_status_idx on recovery_jobs(status);
create index recovery_jobs_assigned_driver_idx on recovery_jobs(assigned_driver_id);
create index driver_profiles_approval_status_idx on driver_profiles(approval_status);
create index driver_job_offers_job_id_idx on driver_job_offers(job_id);
