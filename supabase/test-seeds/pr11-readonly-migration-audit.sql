-- READ-ONLY, for vehicle-recovery-test ONLY. Does not modify schema/data.
-- Checks whether integrated migrations 0009 and 0010 actually exist.
WITH checks AS (
 SELECT
  to_regclass('public.driver_memberships') IS NOT NULL AS membership_table,
  coalesce((SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.driver_memberships')),false) AS membership_rls,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='driver_job_offers' AND column_name='eta_minutes') AS offer_eta_column,
  EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='driver_job_offers' AND policyname='verified active member creates offer') AS membership_insert_policy,
  EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.driver_job_offers'::regclass AND tgname='guard_new_driver_offer_trigger' AND NOT tgisinternal) AS offer_lock_trigger,
  EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.profiles'::regclass AND tgname='guard_profile_privileges_trigger' AND NOT tgisinternal) AS role_protection_trigger,
  EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.driver_profiles'::regclass AND tgname='guard_driver_approval_trigger' AND NOT tgisinternal) AS approval_guard_trigger,
  to_regprocedure('public.accept_customer_offer(uuid)') IS NOT NULL AS customer_accept_rpc,
  to_regprocedure('public.accept_guest_recovery_offer(uuid,uuid)') IS NOT NULL AS guest_accept_rpc,
  coalesce((SELECT pg_get_functiondef(to_regprocedure('public.accept_guest_recovery_offer(uuid,uuid)')) LIKE '%dm.valid_until>now()%' ),false) AS guest_membership_guard,
  coalesce((SELECT pg_get_functiondef(to_regprocedure('public.accept_guest_recovery_offer(uuid,uuid)')) LIKE '%where id=p_job_id for update%' ),false) AS guest_job_lock,
  has_function_privilege('service_role','public.accept_guest_recovery_offer(uuid,uuid)','EXECUTE') AS service_guest_accept_grant,
  NOT has_function_privilege('anon','public.accept_guest_recovery_offer(uuid,uuid)','EXECUTE') AS anon_guest_accept_denied,
  NOT has_function_privilege('authenticated','public.accept_guest_recovery_offer(uuid,uuid)','EXECUTE') AS authenticated_guest_accept_denied,
  to_regprocedure('public.allow_recovery_request(text)') IS NOT NULL AS guest_rate_limit_rpc,
  has_function_privilege('service_role','public.allow_recovery_request(text)','EXECUTE') AS service_rate_limit_grant
)
SELECT *, (
 membership_table AND membership_rls AND offer_eta_column AND membership_insert_policy
 AND offer_lock_trigger AND role_protection_trigger AND approval_guard_trigger
 AND customer_accept_rpc AND guest_accept_rpc AND guest_membership_guard AND guest_job_lock
 AND service_guest_accept_grant AND anon_guest_accept_denied AND authenticated_guest_accept_denied
 AND guest_rate_limit_rpc AND service_rate_limit_grant
) AS all_checks_pass
FROM checks;
