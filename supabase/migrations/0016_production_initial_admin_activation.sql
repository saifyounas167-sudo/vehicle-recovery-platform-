-- REVIEW BEFORE APPLYING. This migration is Production-specific and intentionally
-- does not create an Auth user, seed the target UUID, change any profile role, or
-- execute itself. The separate seed template must be completed after read-only
-- verification of the existing Auth user and the Production role-protection trigger.
--
-- The only runtime caller is the server-side service_role client. The existing
-- ss8_protect_role trigger is not disabled, replaced, or removed.

BEGIN;

CREATE SCHEMA admin_bootstrap_private;

REVOKE ALL ON SCHEMA admin_bootstrap_private
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE admin_bootstrap_private.production_initial_admin_activation (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton IS TRUE),
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  target_email text NOT NULL
    CHECK (target_email = 'saifyounas112@gmail.com'),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

ALTER TABLE admin_bootstrap_private.production_initial_admin_activation
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE admin_bootstrap_private.production_initial_admin_activation
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.activate_initial_production_admin(
  p_user_id uuid,
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_target_user_id uuid;
  v_target_email text;
  v_consumed_at timestamptz;
  v_auth_email text;
  v_email_confirmed_at timestamptz;
  v_profile_role public.user_role;
  v_profile_email text;
  v_rows integer;
BEGIN
  -- A service-role JWT is required even though this function is SECURITY DEFINER.
  IF COALESCE(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    RAISE EXCEPTION 'Activation unavailable' USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NULL
     OR lower(COALESCE(p_email, '')) <> 'saifyounas112@gmail.com' THEN
    RAISE EXCEPTION 'Activation unavailable' USING ERRCODE = '42501';
  END IF;

  -- The singleton row serializes concurrent attempts and pins the exact Auth UUID.
  SELECT activation.target_user_id,
         activation.target_email,
         activation.consumed_at
    INTO v_target_user_id, v_target_email, v_consumed_at
    FROM admin_bootstrap_private.production_initial_admin_activation AS activation
   WHERE activation.singleton IS TRUE
   FOR UPDATE;

  IF NOT FOUND
     OR v_consumed_at IS NOT NULL
     OR v_target_user_id IS DISTINCT FROM p_user_id
     OR v_target_email IS DISTINCT FROM 'saifyounas112@gmail.com' THEN
    RAISE EXCEPTION 'Activation unavailable or already used'
      USING ERRCODE = '42501';
  END IF;

  -- Auth is authoritative: exact email and a completed email confirmation are mandatory.
  SELECT lower(auth_user.email), auth_user.email_confirmed_at
    INTO v_auth_email, v_email_confirmed_at
    FROM auth.users AS auth_user
   WHERE auth_user.id = p_user_id;

  IF NOT FOUND
     OR v_auth_email IS DISTINCT FROM 'saifyounas112@gmail.com'
     OR v_email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Activation unavailable' USING ERRCODE = '42501';
  END IF;

  SELECT profile.role, profile.email
    INTO v_profile_role, v_profile_email
    FROM public.profiles AS profile
   WHERE profile.id = p_user_id
   FOR UPDATE;

  IF NOT FOUND
     OR v_profile_role IS DISTINCT FROM 'customer'::public.user_role
     OR (v_profile_email IS NOT NULL
         AND lower(v_profile_email) <> 'saifyounas112@gmail.com') THEN
    RAISE EXCEPTION 'Activation unavailable' USING ERRCODE = '42501';
  END IF;

  -- This is strictly a first-Admin bootstrap. Never create a second Admin.
  IF EXISTS (
    SELECT 1
      FROM public.profiles AS existing_admin
     WHERE existing_admin.role = 'admin'::public.user_role
  ) THEN
    RAISE EXCEPTION 'Activation unavailable or already used'
      USING ERRCODE = '42501';
  END IF;

  -- Keep the existing role-protection trigger enabled. Its service_role rule
  -- must be independently confirmed before this migration is applied.
  UPDATE public.profiles
     SET role = 'admin'::public.user_role,
         updated_at = pg_catalog.now()
   WHERE id = p_user_id
     AND role = 'customer'::public.user_role;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Activation unavailable' USING ERRCODE = '42501';
  END IF;

  -- Consume the authorization in the same transaction as the role update.
  UPDATE admin_bootstrap_private.production_initial_admin_activation
     SET consumed_at = pg_catalog.now()
   WHERE singleton IS TRUE
     AND consumed_at IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN
    RAISE EXCEPTION 'Activation unavailable or already used'
      USING ERRCODE = '42501';
  END IF;

  RETURN true;
END;
$function$;

-- SECURITY DEFINER functions in public must not inherit PUBLIC/anon/authenticated
-- EXECUTE. Only the server-side service_role client may call this function.
REVOKE ALL ON FUNCTION public.activate_initial_production_admin(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_initial_production_admin(uuid, text)
  TO service_role;

COMMIT;
