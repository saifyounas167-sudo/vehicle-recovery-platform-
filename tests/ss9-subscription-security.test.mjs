import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const get=p=>readFileSync(p,"utf8");
test("SS9 driver only route and no live paid CTA",()=>{const s=get("app/driver/membership/page.tsx");assert.match(s,/requireRole\("driver"\)/);assert.match(s,/disabled aria-disabled="true"/);assert.match(s,/39\.99/);});
test("Production cannot enable Stripe checkout or webhook via env flags",()=>{const s=get("src/lib/driver-billing-gate.ts");assert.match(s,/VERCEL_ENV!=="preview"/);assert.match(s,/sk_test_/);assert.match(s,/ozphvosiqbzvkthlppkd/);});
test("Stripe webhook validates HMAC, event refetch and server billing guard",()=>{assert.match(get("src/lib/stripe-billing.ts"),/timingSafeEqual/);assert.match(get("app/api/stripe/webhook/route.ts"),/verifyStripeSignature/);assert.match(get("app/api/stripe/webhook/route.ts"),/stripeRequest\("GET","events\//);});
test("only server-selected price and customer-specific portal",()=>{assert.match(get("app/api/driver/billing/checkout/route.ts"),/eq\("active_for_new",true\)/);assert.match(get("app/api/driver/billing/portal/route.ts"),/eq\("driver_id",user\.id\)/);});
test("membership schema RLS and no client writes to billing",()=>{const s=get("supabase/migrations/0016_driver_billing_foundation.sql");assert.match(s,/ENABLE ROW LEVEL SECURITY/g);assert.match(s,/REVOKE ALL/);assert.match(s,/pending','active','past_due','cancelled','expired/);assert.doesNotMatch(s,/GRANT UPDATE ON public.driver_billing/);});
test("existing marketplace write gate remains",()=>{const s=get("proxy.ts");assert.match(s,/if\(!allowedGet&&!allowedEstimate\)/);assert.match(get("src/lib/client-review.ts"),/return true/);});

test("atomic RPC handles replay and stale events with service role only",()=>{
 const s=get("supabase/migrations/0016_driver_billing_foundation.sql");
 assert.match(s,/apply_verified_driver_billing_event/);
 assert.match(s,/auth\.role\(\) IS DISTINCT FROM 'service_role'/);
 assert.match(s,/ON CONFLICT DO NOTHING RETURNING event_id/);
 assert.match(s,/RETURN 'duplicate'/);
 assert.match(s,/RETURN 'stale'/);
 assert.match(s,/DROP POLICY IF EXISTS "admin manages membership"/);
 assert.match(s,/REVOKE INSERT, UPDATE, DELETE ON public.driver_memberships/);
});
test("cancel, failed invoice and renewal use latest verified Stripe subscription",()=>{
 const s=get("app/api/stripe/webhook/route.ts");
 for(const e of ["invoice.payment_failed","invoice.paid","customer.subscription.deleted","customer.subscription.updated"])assert.ok(s.includes(e));
 assert.match(s,/stripeRequest\("GET","subscriptions\//);
 assert.match(s,/stripeRequest\("GET","invoices\//);
 assert.match(s,/stripeStatus==="active"&&paid&&period/);
 assert.match(s,/db\.rpc\("apply_verified_driver_billing_event"/);
 assert.doesNotMatch(s,/db\.from\("driver_memberships"\)\.upsert/);
});
