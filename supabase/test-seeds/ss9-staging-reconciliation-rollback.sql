-- SS9: STAGING ONLY. Never execute against Production.
-- Transactional smoke test for applied migration 0016.
-- Creates a synthetic, non-login Auth user/driver and billing records.
-- ROLLBACK at the end leaves ALL staging data unchanged.
-- DO NOT change ROLLBACK to COMMIT.
BEGIN;
SET LOCAL statement_timeout = '45s';
SET LOCAL lock_timeout = '3s';
SELECT set_config('request.jwt.claim.role','service_role',true);
DO $test$
DECLARE
 d uuid:=gen_random_uuid();
 suffix text;
 result text;
 state text;
 active_until timestamptz;
 num_events integer;
 num_invoices integer;
 original_price text;
 old_period timestamptz:=now()+interval '20 days';
 next_period timestamptz:=now()+interval '50 days';
 base_stamp timestamptz:=now()-interval '10 hours';
BEGIN
 suffix:=replace(d::text,'-','');
 -- No existing accounts, subscriptions, passwords or real invoices are touched.
 INSERT INTO auth.users(id,instance_id,aud,role,email,
  encrypted_password,email_confirmed_at,created_at,updated_at,raw_user_meta_data)
 VALUES(d,'00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','ss9-synthetic-'||suffix||'@example.invalid',
  '',now(),now(),now(),'{}'::jsonb);
 -- Some staging projects automatically create a profile on auth.users INSERT.
 -- Update only this newly generated synthetic ID; all work is rolled back.
 INSERT INTO public.profiles(id,role,email,full_name)
 VALUES(d,'driver','ss9-synthetic-'||suffix||'@example.invalid','SS9 Synthetic Test')
 ON CONFLICT (id) DO UPDATE SET
   role=EXCLUDED.role,
   email=EXCLUDED.email,
   full_name=EXCLUDED.full_name;
 INSERT INTO public.driver_profiles(id,approval_status)
 VALUES(d,'pending');
 -- No real Stripe API call: made-up test event/price/customer strings.
 result:=public.apply_verified_driver_billing_event(
   'evt_a'||suffix,'checkout.session.completed',base_stamp,d,
   'cus_a'||suffix,'sub_a'||suffix,'price_a'||suffix,
   'active',old_period,false,'in_a'||suffix,'paid',3999,'gbp');
 IF result<>'applied' THEN RAISE EXCEPTION 'Initial activation: %',result; END IF;
 SELECT status,valid_until INTO state,active_until
 FROM public.driver_memberships WHERE driver_id=d;
 IF state<>'active' OR active_until IS DISTINCT FROM old_period
 THEN RAISE EXCEPTION 'Initial paid membership incorrect'; END IF;
 RAISE NOTICE 'PASS: paid test membership active (driver still pending approval)';

 result:=public.apply_verified_driver_billing_event(
   'evt_a'||suffix,'checkout.session.completed',base_stamp,d,
   'cus_a'||suffix,'sub_a'||suffix,'price_a'||suffix,
   'active',old_period,false,'in_a'||suffix,'paid',3999,'gbp');
 IF result<>'duplicate' THEN RAISE EXCEPTION 'Duplicate event: %',result; END IF;
 SELECT count(*) INTO num_events FROM public.driver_billing_events WHERE event_id='evt_a'||suffix;
 SELECT count(*) INTO num_invoices FROM public.driver_billing_payments WHERE driver_id=d;
 IF num_events<>1 OR num_invoices<>1 THEN
  RAISE EXCEPTION 'Replay duplicated rows: events %, invoices %',num_events,num_invoices;
 END IF;
 RAISE NOTICE 'PASS: duplicate webhook event is idempotent';

 result:=public.apply_verified_driver_billing_event(
   'evt_b'||suffix,'invoice.payment_failed',base_stamp+interval '1 hour',d,
   'cus_a'||suffix,'sub_a'||suffix,'price_a'||suffix,
   'past_due',old_period,false,'in_b'||suffix,'failed',0,'gbp');
 SELECT status,valid_until INTO state,active_until
 FROM public.driver_memberships WHERE driver_id=d;
 IF result<>'applied' OR state<>'past_due' OR active_until IS NOT NULL
 THEN RAISE EXCEPTION 'Failed payment did not restrict membership'; END IF;
 RAISE NOTICE 'PASS: failed payment -> past_due / no valid membership';

 result:=public.apply_verified_driver_billing_event(
   'evt_c'||suffix,'invoice.paid',base_stamp+interval '2 hours',d,
   'cus_a'||suffix,'sub_a'||suffix,'price_a'||suffix,
   'active',next_period,false,'in_c'||suffix,'paid',3999,'gbp');
 SELECT status,valid_until INTO state,active_until
 FROM public.driver_memberships WHERE driver_id=d;
 IF result<>'applied' OR state<>'active' OR active_until IS DISTINCT FROM next_period
 THEN RAISE EXCEPTION 'Paid renewal did not update membership'; END IF;
 RAISE NOTICE 'PASS: paid renewal restores membership with new period';

 -- Late failure cannot deactivate the new renewal.
 result:=public.apply_verified_driver_billing_event(
   'evt_d'||suffix,'invoice.payment_failed',base_stamp+interval '90 minutes',d,
   'cus_a'||suffix,'sub_a'||suffix,'price_a'||suffix,
   'past_due',old_period,false,'in_d'||suffix,'failed',0,'gbp');
 SELECT status INTO state FROM public.driver_memberships WHERE driver_id=d;
 IF result<>'stale' OR state<>'active' THEN
  RAISE EXCEPTION 'Old failure incorrectly changed renewal'; END IF;
 RAISE NOTICE 'PASS: out-of-order payment failure cannot override renewal';

 result:=public.apply_verified_driver_billing_event(
   'evt_e'||suffix,'customer.subscription.deleted',base_stamp+interval '3 hours',d,
   'cus_a'||suffix,'sub_a'||suffix,'price_a'||suffix,
   'cancelled',next_period,true);
 SELECT status,valid_until INTO state,active_until
 FROM public.driver_memberships WHERE driver_id=d;
 IF result<>'applied' OR state<>'cancelled' OR active_until IS NOT NULL
 THEN RAISE EXCEPTION 'Cancellation did not revoke access'; END IF;
 RAISE NOTICE 'PASS: cancellation removes active membership';

 result:=public.apply_verified_driver_billing_event(
   'evt_f'||suffix,'invoice.paid',base_stamp+interval '150 minutes',d,
   'cus_a'||suffix,'sub_a'||suffix,'price_a'||suffix,
   'active',next_period,false,'in_f'||suffix,'paid',3999,'gbp');
 SELECT status INTO state FROM public.driver_memberships WHERE driver_id=d;
 IF result<>'stale' OR state<>'cancelled'
 THEN RAISE EXCEPTION 'Stale renewal incorrectly reactivated cancellation'; END IF;
 RAISE NOTICE 'PASS: old renewal cannot reactivate cancelled membership';

 -- New-driver list-price changes do not rewrite an existing Stripe subscription's price ID.
 SELECT stripe_price_id INTO original_price
 FROM public.driver_billing_accounts WHERE driver_id=d;
 INSERT INTO public.driver_billing_prices(stripe_price_id,amount_pence,currency,active_for_new)
 VALUES('price_new'||suffix,4999,'gbp',false);
 IF (SELECT stripe_price_id FROM public.driver_billing_accounts WHERE driver_id=d)
 IS DISTINCT FROM original_price THEN
  RAISE EXCEPTION 'New plan price changed existing subscriber'; END IF;
 RAISE NOTICE 'PASS: existing subscription price unaffected by draft new pricing';

 IF has_table_privilege('authenticated','public.driver_memberships','UPDATE')
 OR has_table_privilege('authenticated','public.driver_memberships','INSERT')
 OR has_table_privilege('authenticated','public.driver_billing_prices','UPDATE')
 OR has_function_privilege('authenticated',
  'public.apply_verified_driver_billing_event(text,text,timestamptz,uuid,text,text,text,text,timestamptz,boolean,text,text,integer,text)',
  'EXECUTE')
 THEN RAISE EXCEPTION 'Browser client has billing write privileges'; END IF;
 RAISE NOTICE 'PASS: authenticated drivers cannot activate membership or edit prices';

 SELECT count(*) INTO num_invoices FROM public.driver_billing_payments WHERE driver_id=d;
 IF num_invoices<>5 THEN
  RAISE EXCEPTION 'Unexpected invoice count %, expected 5',num_invoices; END IF;
 RAISE NOTICE 'PASS: replay-safe billing history; invoice rows=%',num_invoices;
 RAISE NOTICE 'ALL ASSERTIONS PASSED. Transaction will now ROLLBACK.';
END;
$test$;
ROLLBACK;
-- Verify: no records persist from this transaction.
-- If an exception occurs, the transaction aborts and must be rolled back.
