-- PREPARATION ONLY. Review and apply to ISOLATED STAGING manually first.
-- This migration never makes any membership active or initiates a charge.
BEGIN;
ALTER TABLE public.driver_memberships DROP CONSTRAINT IF EXISTS driver_memberships_status_check;
ALTER TABLE public.driver_memberships ADD CONSTRAINT driver_memberships_status_check
 CHECK(status IN ('inactive','pending','active','past_due','cancelled','expired'));
ALTER TABLE public.driver_memberships ENABLE ROW LEVEL SECURITY;
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
DROP POLICY IF EXISTS "admin reads memberships" ON public.driver_memberships;
CREATE POLICY "admin reads memberships" ON public.driver_memberships FOR SELECT TO authenticated USING (public.current_user_role()='admin');


-- Service-role RPC: event ID, invoice row and membership reconcile atomically.
-- Stripe signature and current paid subscription must be checked server-side.
ALTER TABLE public.driver_billing_accounts
 ADD COLUMN IF NOT EXISTS last_event_created timestamptz,
 ADD COLUMN IF NOT EXISTS last_event_id text;

CREATE OR REPLACE FUNCTION public.apply_verified_driver_billing_event(
 p_event_id text, p_event_type text, p_created timestamptz,
 p_driver_id uuid, p_customer text, p_subscription text, p_price text,
 p_state text, p_period_end timestamptz, p_cancel_at_period_end boolean,
 p_invoice text DEFAULT NULL, p_invoice_state text DEFAULT NULL,
 p_amount integer DEFAULT NULL, p_currency text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 a public.driver_billing_accounts%ROWTYPE;
 v_event text;
 v_state text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN
  RAISE EXCEPTION 'Service-role billing only' USING ERRCODE='42501';
 END IF;
 IF p_event_id !~ '^evt_[[:alnum:]]+$'
 OR p_event_type NOT IN ('checkout.session.completed','customer.subscription.updated',
                        'customer.subscription.deleted','invoice.paid','invoice.payment_failed')
 OR p_created IS NULL OR p_driver_id IS NULL
 OR p_customer !~ '^cus_[[:alnum:]]+$'
 OR p_subscription !~ '^sub_[[:alnum:]]+$'
 OR p_price !~ '^price_[[:alnum:]]+$'
 OR p_state NOT IN ('pending','active','past_due','cancelled','expired')
 THEN RAISE EXCEPTION 'Invalid billing event'; END IF;
 IF p_invoice IS NOT NULL AND
   (p_invoice !~ '^in_[[:alnum:]]+$'
    OR p_invoice_state NOT IN ('paid','failed')
    OR p_amount IS NULL OR p_amount < 0 OR p_currency <> 'gbp')
 THEN RAISE EXCEPTION 'Invalid invoice record'; END IF;
 IF p_invoice IS NULL AND
   (p_invoice_state IS NOT NULL OR p_amount IS NOT NULL OR p_currency IS NOT NULL)
 THEN RAISE EXCEPTION 'Unexpected invoice details'; END IF;
 -- Serialize per driver, including first-time account creation.
 PERFORM 1 FROM public.driver_profiles AS d
 JOIN public.profiles AS p ON p.id=d.id
 WHERE d.id=p_driver_id AND p.role='driver'
 FOR UPDATE OF d;
 IF NOT FOUND THEN RAISE EXCEPTION 'Driver profile missing'; END IF;
 SELECT * INTO a FROM public.driver_billing_accounts
 WHERE driver_id=p_driver_id FOR UPDATE;
 IF FOUND AND (
  (a.stripe_customer_id IS NOT NULL AND a.stripe_customer_id<>p_customer)
  OR (a.subscription_id IS NOT NULL AND a.subscription_id<>p_subscription)
 ) THEN RAISE EXCEPTION 'Billing owner mismatch'; END IF;
 INSERT INTO public.driver_billing_events(event_id,event_type,event_created)
 VALUES(p_event_id,p_event_type,p_created)
 ON CONFLICT(event_id) DO NOTHING RETURNING event_id INTO v_event;
 IF v_event IS NULL THEN RETURN 'duplicate'; END IF;
 -- Store invoice history even when the subscription-state event is stale.
 IF p_invoice IS NOT NULL THEN
  INSERT INTO public.driver_billing_payments
   (stripe_invoice_id,driver_id,amount_paid_pence,currency,status,paid_at)
  VALUES(p_invoice,p_driver_id,p_amount,p_currency,p_invoice_state,
   CASE WHEN p_invoice_state='paid' THEN p_created ELSE NULL END)
  ON CONFLICT(stripe_invoice_id) DO UPDATE SET
   status=CASE WHEN public.driver_billing_payments.status='paid' THEN 'paid'
               ELSE EXCLUDED.status END,
   amount_paid_pence=CASE WHEN public.driver_billing_payments.status='paid'
                            THEN public.driver_billing_payments.amount_paid_pence
                            ELSE EXCLUDED.amount_paid_pence END,
   paid_at=COALESCE(public.driver_billing_payments.paid_at,EXCLUDED.paid_at)
  WHERE public.driver_billing_payments.driver_id=EXCLUDED.driver_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invoice ownership mismatch'; END IF;
 END IF;
 -- Out-of-order events cannot supersede a newer membership state.
 IF a.last_event_created IS NOT NULL
  AND (p_created < a.last_event_created
       OR (p_created=a.last_event_created
           AND p_event_id<=COALESCE(a.last_event_id,''))) THEN
   RETURN 'stale';
 END IF;
 -- Never create a newly active row with an expired/null paid period.
 v_state := CASE WHEN p_state='active'
                 AND (p_period_end IS NULL OR p_period_end<=now())
                 THEN 'expired' ELSE p_state END;
 INSERT INTO public.driver_billing_accounts
  (driver_id,stripe_customer_id,subscription_id,stripe_price_id,
   current_period_end,cancel_at_period_end,updated_at,last_event_created,last_event_id)
 VALUES(p_driver_id,p_customer,p_subscription,p_price,p_period_end,
        COALESCE(p_cancel_at_period_end,false),now(),p_created,p_event_id)
 ON CONFLICT(driver_id) DO UPDATE SET
  stripe_customer_id=COALESCE(public.driver_billing_accounts.stripe_customer_id,EXCLUDED.stripe_customer_id),
  subscription_id=COALESCE(public.driver_billing_accounts.subscription_id,EXCLUDED.subscription_id),
  stripe_price_id=EXCLUDED.stripe_price_id,
  current_period_end=EXCLUDED.current_period_end,
  cancel_at_period_end=EXCLUDED.cancel_at_period_end,
  updated_at=now(),
  last_event_created=EXCLUDED.last_event_created,
  last_event_id=EXCLUDED.last_event_id;
 INSERT INTO public.driver_memberships(driver_id,status,valid_until,updated_at)
 VALUES(p_driver_id,v_state,CASE WHEN v_state='active' THEN p_period_end ELSE NULL END,now())
 ON CONFLICT(driver_id) DO UPDATE SET
  status=EXCLUDED.status,valid_until=EXCLUDED.valid_until,updated_at=now();
 RETURN 'applied';
END;
$$;

REVOKE ALL ON FUNCTION public.apply_verified_driver_billing_event(
 text,text,timestamptz,uuid,text,text,text,text,timestamptz,boolean,text,text,integer,text
) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_verified_driver_billing_event(
 text,text,timestamptz,uuid,text,text,text,text,timestamptz,boolean,text,text,integer,text
) TO service_role;

COMMIT;
-- STAGING VERIFICATION ONLY (read-only):
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname='public' AND tablename IN ('driver_memberships',
-- 'driver_billing_prices','driver_billing_accounts','driver_billing_payments')
-- ORDER BY tablename, policyname;
-- SELECT has_table_privilege('authenticated','public.driver_memberships','UPDATE') AS driver_can_update; -- false
-- SELECT has_function_privilege('authenticated',
-- 'public.apply_verified_driver_billing_event(text,text,timestamptz,uuid,text,text,text,text,timestamptz,boolean,text,text,integer,text)',
-- 'EXECUTE') AS client_can_run_reconcile; -- false
-- SELECT status, count(*) FROM public.driver_memberships GROUP BY status;
-- No DROP TABLE or data-deleting rollback is included: preserve existing billing data.
