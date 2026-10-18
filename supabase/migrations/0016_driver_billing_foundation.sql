-- PREPARATION ONLY. Review and apply to ISOLATED STAGING manually first.
-- This migration never makes any membership active or initiates a charge.
BEGIN;
ALTER TABLE public.driver_memberships DROP CONSTRAINT IF EXISTS driver_memberships_status_check;
ALTER TABLE public.driver_memberships ADD CONSTRAINT driver_memberships_status_check
 CHECK(status IN ('inactive','pending','active','past_due','cancelled','expired'));
CREATE TABLE IF NOT EXISTS public.driver_billing_prices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 stripe_price_id text UNIQUE,
 currency text NOT NULL DEFAULT 'gbp' CHECK(currency='gbp'),
 amount_pence integer NOT NULL CHECK(amount_pence>0),
 interval_unit text NOT NULL DEFAULT 'month' CHECK(interval_unit='month'),
 active_for_new boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid REFERENCES public.profiles(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_driver_billing_price ON public.driver_billing_prices(active_for_new) WHERE active_for_new=true;
CREATE TABLE IF NOT EXISTS public.driver_billing_accounts (
 driver_id uuid PRIMARY KEY REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
 stripe_customer_id text UNIQUE,
 subscription_id text UNIQUE,
 stripe_price_id text,
 current_period_end timestamptz,
 cancel_at_period_end boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.driver_billing_events (
 event_id text PRIMARY KEY,
 event_type text NOT NULL,
 event_created timestamptz NOT NULL,
 processed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.driver_billing_payments (
 stripe_invoice_id text PRIMARY KEY,
 driver_id uuid NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
 amount_paid_pence integer NOT NULL DEFAULT 0 CHECK(amount_paid_pence>=0),
 currency text NOT NULL,
 status text NOT NULL,
 paid_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.driver_billing_price_changes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 stripe_price_id text NOT NULL,
 effective_at timestamptz NOT NULL,
 affected_driver_id uuid REFERENCES public.driver_profiles(id),
 notice_sent_at timestamptz,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','notice_pending','scheduled','applied','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now()
);
-- Billing state must be written exclusively by verified server webhook/service role,
-- NOT by driver or admin browser RLS policies.
ALTER TABLE public.driver_billing_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_billing_price_changes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.driver_billing_prices,public.driver_billing_accounts,public.driver_billing_events,public.driver_billing_payments,public.driver_billing_price_changes FROM anon,authenticated;
GRANT SELECT ON public.driver_billing_prices,public.driver_billing_accounts,public.driver_billing_payments,public.driver_billing_price_changes TO authenticated;
DROP POLICY IF EXISTS "billing price visible to drivers and admins" ON public.driver_billing_prices;
CREATE POLICY "billing price visible to drivers and admins" ON public.driver_billing_prices FOR SELECT TO authenticated
 USING(public.current_user_role() IN ('driver','admin'));
DROP POLICY IF EXISTS "driver sees own billing account" ON public.driver_billing_accounts;
CREATE POLICY "driver sees own billing account" ON public.driver_billing_accounts FOR SELECT TO authenticated
 USING(driver_id=auth.uid() OR public.current_user_role()='admin');
DROP POLICY IF EXISTS "driver sees own invoices" ON public.driver_billing_payments;
CREATE POLICY "driver sees own invoices" ON public.driver_billing_payments FOR SELECT TO authenticated
 USING(driver_id=auth.uid() OR public.current_user_role()='admin');
DROP POLICY IF EXISTS "admin sees planned changes" ON public.driver_billing_price_changes;
CREATE POLICY "admin sees planned changes" ON public.driver_billing_price_changes FOR SELECT TO authenticated
 USING(public.current_user_role()='admin' OR affected_driver_id=auth.uid());
-- Restrict membership activation to service-role billing reconciliation.
DROP POLICY IF EXISTS "admin manages membership" ON public.driver_memberships;
REVOKE INSERT, UPDATE, DELETE ON public.driver_memberships FROM authenticated, anon;
GRANT SELECT ON public.driver_memberships TO authenticated;
CREATE POLICY "admin reads memberships" ON public.driver_memberships FOR SELECT TO authenticated USING (public.current_user_role()='admin');

-- Atomic, service-role-only event processing and replay protection.
ALTER TABLE public.driver_billing_accounts ADD COLUMN IF NOT EXISTS last_event_created timestamptz;
ALTER TABLE public.driver_billing_accounts ADD COLUMN IF NOT EXISTS last_event_id text;
CREATE OR REPLACE FUNCTION public.apply_verified_driver_billing_event(
 p_event_id text,p_event_type text,p_created timestamptz,p_driver_id uuid,
 p_customer text,p_subscription text,p_price text,p_state text,
 p_period_end timestamptz,p_cancel_at_period_end boolean,
 p_invoice text DEFAULT NULL,p_invoice_state text DEFAULT NULL,
 p_amount integer DEFAULT NULL,p_currency text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $
DECLARE a public.driver_billing_accounts%rowtype; inserted text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'service only' USING ERRCODE='42501';
 END IF;
 IF p_event_id IS NULL OR p_created IS NULL OR p_driver_id IS NULL
 OR p_customer !~ '^cus_[[:alnum:]]+ (READ ONLY):
-- SELECT tablename,policyname,cmd FROM pg_policies WHERE tablename LIKE 'driver_billing_%';
-- SELECT status,count(*) FROM public.driver_memberships GROUP BY status;
-- SELECT relname,relrowsecurity FROM pg_class WHERE relname LIKE 'driver_billing_%';
-- ROLLBACK ONLY BEFORE USING BILLING TABLES:
-- DROP TABLE IF EXISTS public.driver_billing_price_changes,public.driver_billing_payments,
-- public.driver_billing_events,public.driver_billing_accounts,public.driver_billing_prices;
-- ALTER TABLE public.driver_memberships DROP CONSTRAINT IF EXISTS driver_memberships_status_check;
-- ALTER TABLE public.driver_memberships ADD CONSTRAINT driver_memberships_status_check
-- CHECK(status IN ('inactive','active','past_due','cancelled'));

 OR p_subscription !~ '^sub_[[:alnum:]]+ (READ ONLY):
-- SELECT tablename,policyname,cmd FROM pg_policies WHERE tablename LIKE 'driver_billing_%';
-- SELECT status,count(*) FROM public.driver_memberships GROUP BY status;
-- SELECT relname,relrowsecurity FROM pg_class WHERE relname LIKE 'driver_billing_%';
-- ROLLBACK ONLY BEFORE USING BILLING TABLES:
-- DROP TABLE IF EXISTS public.driver_billing_price_changes,public.driver_billing_payments,
-- public.driver_billing_events,public.driver_billing_accounts,public.driver_billing_prices;
-- ALTER TABLE public.driver_memberships DROP CONSTRAINT IF EXISTS driver_memberships_status_check;
-- ALTER TABLE public.driver_memberships ADD CONSTRAINT driver_memberships_status_check
-- CHECK(status IN ('inactive','active','past_due','cancelled'));

 OR p_price !~ '^price_[[:alnum:]]+ (READ ONLY):
-- SELECT tablename,policyname,cmd FROM pg_policies WHERE tablename LIKE 'driver_billing_%';
-- SELECT status,count(*) FROM public.driver_memberships GROUP BY status;
-- SELECT relname,relrowsecurity FROM pg_class WHERE relname LIKE 'driver_billing_%';
-- ROLLBACK ONLY BEFORE USING BILLING TABLES:
-- DROP TABLE IF EXISTS public.driver_billing_price_changes,public.driver_billing_payments,
-- public.driver_billing_events,public.driver_billing_accounts,public.driver_billing_prices;
-- ALTER TABLE public.driver_memberships DROP CONSTRAINT IF EXISTS driver_memberships_status_check;
-- ALTER TABLE public.driver_memberships ADD CONSTRAINT driver_memberships_status_check
-- CHECK(status IN ('inactive','active','past_due','cancelled'));

 OR p_state NOT IN ('pending','active','past_due','cancelled','expired')
 THEN RAISE EXCEPTION 'invalid billing event'; END IF;
 PERFORM 1 FROM public.driver_profiles d JOIN public.profiles p ON p.id=d.id
 WHERE d.id=p_driver_id AND p.role='driver' FOR UPDATE OF d;
 IF NOT FOUND THEN RAISE EXCEPTION 'unknown driver'; END IF;
 SELECT * INTO a FROM public.driver_billing_accounts
 WHERE driver_id=p_driver_id FOR UPDATE;
 IF FOUND AND (a.stripe_customer_id IS DISTINCT FROM p_customer
 OR a.subscription_id IS DISTINCT FROM p_subscription)
 THEN RAISE EXCEPTION 'billing identity conflict'; END IF;
 INSERT INTO public.driver_billing_events(event_id,event_type,event_created)
 VALUES(p_event_id,p_event_type,p_created)
 ON CONFLICT DO NOTHING RETURNING event_id INTO inserted;
 IF inserted IS NULL THEN RETURN 'duplicate'; END IF;
 IF p_invoice IS NOT NULL THEN
  IF p_invoice !~ '^in_[[:alnum:]]+ (READ ONLY):
-- SELECT tablename,policyname,cmd FROM pg_policies WHERE tablename LIKE 'driver_billing_%';
-- SELECT status,count(*) FROM public.driver_memberships GROUP BY status;
-- SELECT relname,relrowsecurity FROM pg_class WHERE relname LIKE 'driver_billing_%';
-- ROLLBACK ONLY BEFORE USING BILLING TABLES:
-- DROP TABLE IF EXISTS public.driver_billing_price_changes,public.driver_billing_payments,
-- public.driver_billing_events,public.driver_billing_accounts,public.driver_billing_prices;
-- ALTER TABLE public.driver_memberships DROP CONSTRAINT IF EXISTS driver_memberships_status_check;
-- ALTER TABLE public.driver_memberships ADD CONSTRAINT driver_memberships_status_check
-- CHECK(status IN ('inactive','active','past_due','cancelled'));
 OR p_invoice_state NOT IN ('paid','failed')
  OR p_currency<>'gbp' OR p_amount IS NULL OR p_amount<0
  THEN RAISE EXCEPTION 'invalid invoice'; END IF;
  INSERT INTO public.driver_billing_payments
  (stripe_invoice_id,driver_id,amount_paid_pence,currency,status,paid_at)
  VALUES(p_invoice,p_driver_id,p_amount,p_currency,p_invoice_state,
   CASE WHEN p_invoice_state='paid' THEN p_created ELSE NULL END)
  ON CONFLICT(stripe_invoice_id) DO UPDATE SET
   status=CASE WHEN public.driver_billing_payments.status='paid' THEN 'paid' ELSE EXCLUDED.status END,
   amount_paid_pence=CASE WHEN public.driver_billing_payments.status='paid' THEN public.driver_billing_payments.amount_paid_pence ELSE EXCLUDED.amount_paid_pence END,
   paid_at=COALESCE(public.driver_billing_payments.paid_at,EXCLUDED.paid_at)
  WHERE public.driver_billing_payments.driver_id=EXCLUDED.driver_id;
 END IF;
 IF a.last_event_created IS NOT NULL AND
  (p_created<a.last_event_created OR
   (p_created=a.last_event_created AND p_event_id<=COALESCE(a.last_event_id,'')))
 THEN RETURN 'stale'; END IF;
 INSERT INTO public.driver_billing_accounts
  (driver_id,stripe_customer_id,subscription_id,stripe_price_id,
   current_period_end,cancel_at_period_end,last_event_created,last_event_id)
 VALUES(p_driver_id,p_customer,p_subscription,p_price,p_period_end,
  COALESCE(p_cancel_at_period_end,false),p_created,p_event_id)
 ON CONFLICT(driver_id) DO UPDATE SET
  stripe_price_id=EXCLUDED.stripe_price_id,
  current_period_end=EXCLUDED.current_period_end,
  cancel_at_period_end=EXCLUDED.cancel_at_period_end,
  last_event_created=EXCLUDED.last_event_created,last_event_id=EXCLUDED.last_event_id,
  updated_at=now();
 INSERT INTO public.driver_memberships(driver_id,status,valid_until)
 VALUES(p_driver_id,p_state,
  CASE WHEN p_state='active' AND p_period_end>now() THEN p_period_end ELSE NULL END)
 ON CONFLICT(driver_id) DO UPDATE SET
  status=CASE WHEN EXCLUDED.valid_until IS NULL THEN
     CASE WHEN EXCLUDED.status='active' THEN 'expired' ELSE EXCLUDED.status END
     ELSE EXCLUDED.status END,
  valid_until=EXCLUDED.valid_until,updated_at=now();
 RETURN 'applied';
END $;
REVOKE ALL ON FUNCTION public.apply_verified_driver_billing_event(
 text,text,timestamptz,uuid,text,text,text,text,timestamptz,boolean,text,text,integer,text
) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_verified_driver_billing_event(
 text,text,timestamptz,uuid,text,text,text,text,timestamptz,boolean,text,text,integer,text
) TO service_role;

COMMIT;
-- VERIFY (READ ONLY):
-- SELECT tablename,policyname,cmd FROM pg_policies WHERE tablename LIKE 'driver_billing_%';
-- SELECT status,count(*) FROM public.driver_memberships GROUP BY status;
-- SELECT relname,relrowsecurity FROM pg_class WHERE relname LIKE 'driver_billing_%';
-- ROLLBACK ONLY BEFORE USING BILLING TABLES:
-- DROP TABLE IF EXISTS public.driver_billing_price_changes,public.driver_billing_payments,
-- public.driver_billing_events,public.driver_billing_accounts,public.driver_billing_prices;
-- ALTER TABLE public.driver_memberships DROP CONSTRAINT IF EXISTS driver_memberships_status_check;
-- ALTER TABLE public.driver_memberships ADD CONSTRAINT driver_memberships_status_check
-- CHECK(status IN ('inactive','active','past_due','cancelled'));
