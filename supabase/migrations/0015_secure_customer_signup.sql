-- REVIEW BEFORE APPLYING, STAGING FIRST. Never run automatically.
-- Prerequisites: public.profiles, public.user_role and existing role-protection triggers.
-- The trigger cannot take the role from user-supplied metadata.
BEGIN;
CREATE OR REPLACE FUNCTION public.create_customer_profile_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '' AS $$
BEGIN
  -- Only the customer registration flow provisions a Customer profile.
  -- This metadata is untrusted: it grants ONLY customer, never driver/admin.
  -- Other Auth signups (e.g. Driver Registration) keep their established
  -- trusted, admin-gated profile-creation flow.
  IF COALESCE(NEW.raw_user_meta_data->>'registration_flow','') <> 'customer_public_v1'
  THEN RETURN NEW; END IF;
  -- Existing account roles are never overwritten by this function.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN RETURN NEW; END IF;
  INSERT INTO public.profiles(id, role, full_name, email, phone)
  VALUES (NEW.id, 'customer'::public.user_role,
    NULLIF(LEFT(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name','')),100),''),
    NEW.email,
    NULLIF(LEFT(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone','')),30),''));
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_customer_profile_on_signup() FROM PUBLIC, anon, authenticated;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid='auth.users'::regclass AND NOT tgisinternal
      AND tgname <> 'on_auth_user_created_customer'
      AND (pg_get_triggerdef(oid) ILIKE '%insert%')
  ) THEN
    RAISE EXCEPTION 'Existing auth.users INSERT trigger detected: review and reuse before applying';
  END IF;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
CREATE TRIGGER on_auth_user_created_customer
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_customer_profile_on_signup();
COMMIT;
-- Verify:
-- SELECT tgname,tgenabled,pg_get_triggerdef(oid) FROM pg_trigger
-- WHERE tgrelid='auth.users'::regclass AND NOT tgisinternal;
-- SELECT proname,prosecdef FROM pg_proc WHERE proname='create_customer_profile_on_signup';
-- Rollback (review before execution):
-- DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
-- DROP FUNCTION IF EXISTS public.create_customer_profile_on_signup();
