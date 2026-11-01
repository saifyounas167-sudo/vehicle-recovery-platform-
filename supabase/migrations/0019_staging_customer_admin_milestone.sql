-- UK RECOVERY — CUSTOMER + ADMIN MILESTONE — STAGING ONLY
-- Manual approval required. Run ONLY in Supabase ozphvosiqbzvkthlppkd SQL Editor.
-- Does not touch existing users, profiles, memberships, billing or Driver approval.
-- Deliberately fails closed on unexpected partially-created marketplace objects.
BEGIN;
DO $prereq$
BEGIN
 IF to_regclass('public.profiles') IS NULL
    OR to_regclass('public.driver_profiles') IS NULL
    OR to_regtype('public.user_role') IS NULL
    OR to_regtype('public.driver_approval_status') IS NULL
 THEN RAISE EXCEPTION 'Existing identity foundation missing; do not apply'; END IF;
 IF to_regclass('public.recovery_jobs') IS NOT NULL
    OR to_regclass('public.recovery_job_private_contacts') IS NOT NULL
    OR to_regclass('public.recovery_request_rate_limits') IS NOT NULL
 THEN RAISE EXCEPTION 'Customer milestone schema already partly present: reconcile manually'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
   WHERE t.tgrelid='auth.users'::regclass
   AND t.tgname='on_auth_user_created_customer' AND t.tgenabled='O'
   AND p.proname='create_customer_profile_on_signup')
 THEN RAISE EXCEPTION 'Existing enabled Auth signup trigger missing'; END IF;
END $prereq$;
DO $types$
BEGIN
 IF to_regtype('public.job_status') IS NULL THEN
  CREATE TYPE public.job_status AS ENUM
  ('draft','submitted','matching','offered','assigned','in_progress','completed','cancelled');
 END IF;
END $types$;
CREATE TABLE public.recovery_jobs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 customer_id uuid REFERENCES public.profiles(id),
 recovery_type text NOT NULL,
 pickup_postcode text NOT NULL,pickup_address text,
 pickup_latitude numeric(10,7),pickup_longitude numeric(10,7),
 destination_postcode text,destination_address text,
 destination_latitude numeric(10,7),destination_longitude numeric(10,7),
 nearest_garage_requested boolean NOT NULL DEFAULT false,
 roadside_assistance_requested boolean NOT NULL DEFAULT false,
 vehicle_registration text,vehicle_make text,vehicle_model text,vehicle_type text,
 transmission text,running_status text,rolling_status text,wheel_condition text,
 accident_status text,problem_description text,
 photos text[] NOT NULL DEFAULT '{}',is_urgent boolean NOT NULL DEFAULT false,
 preferred_collection_time timestamptz,customer_contact_preference text,
 estimated_quote_gbp numeric(10,2),
 status public.job_status NOT NULL DEFAULT 'submitted',
 assigned_driver_id uuid REFERENCES public.driver_profiles(id),
 guest_reference text UNIQUE, request_fingerprint text UNIQUE,
 passenger_count smallint CHECK (passenger_count BETWEEN 0 AND 8),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX recovery_jobs_customer_id_idx ON public.recovery_jobs(customer_id);
CREATE INDEX recovery_jobs_status_idx ON public.recovery_jobs(status);
CREATE INDEX recovery_jobs_assigned_driver_idx ON public.recovery_jobs(assigned_driver_id);
ALTER TABLE public.recovery_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recovery_jobs FROM anon,authenticated;
-- SELECT permission is restricted to own Customer records or an existing authenticated Admin.
GRANT SELECT ON public.recovery_jobs TO authenticated;
CREATE POLICY "milestone customer own and admin jobs read" ON public.recovery_jobs
 FOR SELECT TO authenticated USING
 (customer_id=auth.uid() OR EXISTS
   (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));
-- Writes are exclusively via the validated server API with Staging service role.
CREATE TABLE public.recovery_job_private_contacts(
 job_id uuid PRIMARY KEY REFERENCES public.recovery_jobs(id) ON DELETE CASCADE,
 full_name text NOT NULL,phone text NOT NULL,email text,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recovery_job_private_contacts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recovery_job_private_contacts FROM anon,authenticated;
CREATE TABLE public.recovery_request_rate_limits(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 client_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX recovery_request_rate_limits_lookup
 ON public.recovery_request_rate_limits(client_hash,created_at);
ALTER TABLE public.recovery_request_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recovery_request_rate_limits FROM anon,authenticated;
CREATE OR REPLACE FUNCTION public.allow_recovery_request(p_client_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $fn$
DECLARE recent_count integer;
BEGIN
 IF p_client_hash IS NULL OR length(p_client_hash)<>64 THEN RETURN false; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(p_client_hash));
 SELECT count(*) INTO recent_count FROM public.recovery_request_rate_limits
 WHERE client_hash=p_client_hash AND created_at>now()-interval '1 hour';
 IF recent_count>=5 THEN RETURN false; END IF;
 INSERT INTO public.recovery_request_rate_limits(client_hash) VALUES(p_client_hash);
 RETURN true;
END $fn$;
REVOKE ALL ON FUNCTION public.allow_recovery_request(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.allow_recovery_request(text) TO service_role;
COMMIT;
-- This milestone intentionally does NOT enable offers, bookings, Driver job matches,
-- notification triggers, payments or any live marketplace operations.
