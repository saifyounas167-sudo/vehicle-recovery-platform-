-- MANUAL ONE-TIME SEED TEMPLATE — DO NOT RUN AS WRITTEN.
--
-- Only after the migration is reviewed/applied and the exact existing Auth user
-- has been confirmed in Production:
--   1. Replace the UUID placeholder with that user's auth.users.id.
--   2. Confirm that auth.users.email is saifyounas112@gmail.com.
--   3. Confirm email_confirmed_at is NOT NULL.
--   4. Confirm the matching public.profiles row currently has role = 'customer'.
--   5. Confirm no Admin profile already exists.
--
-- This inserts an allowlist for one existing user. It does not create a user or
-- change a role. Do not add a second row or modify an existing consumed row.

INSERT INTO admin_bootstrap_private.production_initial_admin_activation
  (singleton, target_user_id, target_email)
VALUES
  (true, 'REPLACE_WITH_VERIFIED_AUTH_USER_UUID'::uuid, 'saifyounas112@gmail.com');
