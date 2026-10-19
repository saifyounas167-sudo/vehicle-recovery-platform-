import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=p=>readFileSync(p,"utf8");
const view=()=>file("app/driver/membership/membership-view.tsx");
test("SS9 is driver-protected and Stripe remains disabled",()=>{
 const page=file("app/driver/membership/page.tsx"),v=view();
 assert.match(page,/requireRole\("driver"\)/);
 assert.match(v,/disabled aria-disabled="true"/);
 assert.match(v,/aria-describedby="ss9-disabled-reason"/);
 assert.match(v,/£39\.99/);
 assert.doesNotMatch(page+v,/stripeRequest|isStripeBillingSandboxEnabled|billingDb|signUp\(|checkout\/sessions|supabase\.from/);
});
test("Single card exactly matches Screenshot 9 content",()=>{
 const v=view();
 const expected=["Driver Membership","Choose a plan to start receiving recovery jobs.","Monthly Plan","£39.99"," / month",
 "Receive recovery job notifications","Send quotes to customers","Manage your profile","Cancel anytime",
 "Subscribe with Stripe","Secure payment powered by Stripe"];
 for(const label of expected)assert.ok(v.includes(label),label);
 assert.equal((v.match(/<section className="ss9-card"/g)||[]).length,1);
 assert.equal((v.match(/<li key=\{benefit\}>/g)||[]).length,1);
 for(const extra of ["Membership Status","How membership works","Driver verification","ss9-breadcrumb","ss9-footer","Provisional price"])assert.doesNotMatch(v,new RegExp(extra,"i"));
});
test("Functional navigation remains within collapsible accessible menu",()=>{
 const v=view();assert.match(v,/<details className="ss9-nav">/);
 assert.match(v,/aria-label="Open navigation menu"/);
 assert.match(v,/href="\/driver"/);assert.match(v,/href="\/driver\/register"/);
 assert.match(file("app/driver/membership/page.tsx"),/AccountNavigation/);
});
test("No other routes or paid backend changes",()=>{
 assert.match(file("app/driver/page.tsx"),/href="\/driver\/membership"/);
 assert.match(file("src/lib/client-review.ts"),/return true/);
 assert.match(file("proxy.ts"),/if\(!allowedGet&&!allowedEstimate\)/);
 assert.doesNotMatch(view(),/driver_billing_|driver_memberships|driver_profiles/);
});
