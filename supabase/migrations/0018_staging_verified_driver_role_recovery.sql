-- STAGING ONLY. Review and apply manually in ozphvosiqbzvkthlppkd; never Production.
-- A verified operator must explicitly approve recovery after checking the Auth signup origin.
-- This RPC is NEVER callable by ordinary logged-in users.
BEGIN;
CREATE OR REPLACE FUNCTION public.ss8_recover_verified_driver_signup(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
DECLARE v_auth auth.users%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_auth FROM auth.users WHERE id=p_user_id FOR UPDATE;
  IF NOT FOUND OR v_auth.email_confirmed_at IS NULL
     OR COALESCE(v_auth.raw_user_meta_data->>'registration_flow','') <> 'driver_application_v1'
  THEN RETURN false; END IF;
  -- Never relabel a Customer account with existing Customer marketplace activity.
  IF EXISTS (SELECT 1 FROM public.recovery_jobs WHERE customer_id=p_user_id)
     OR EXISTS (SELECT 1 FROM public.driver_profiles WHERE id=p_user_id)
  THEN RETURN false; END IF;
  -- Role protection triggers stay active; an approved service-role call is required.
  UPDATE public.profiles SET role='driver'
   WHERE id=p_user_id AND role='customer';
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.ss8_recover_verified_driver_signup(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ss8_recover_verified_driver_signup(uuid) TO service_role;
COMMIT;
