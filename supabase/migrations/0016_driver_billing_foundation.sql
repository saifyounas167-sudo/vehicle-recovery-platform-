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
