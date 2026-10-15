import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("combined release preserves Screenshot 3 and immutable production read-only guard",()=>{
 const estimate=read("app/components/estimate-result.tsx"),guard=read("src/lib/client-review.ts"),proxy=read("proxy.ts");
 assert.match(estimate,/Estimated Price/);assert.match(estimate,/Price to be confirmed by recovery drivers/);
 assert.match(guard,/return true/);assert.match(proxy,/if\(!allowedGet&&!allowedEstimate\)/);
});
test("SS4/SS5 never use sample recovery companies, prices, reviews or fake ratings",()=>{
 const source=read("app/components/customer-driver-offers.tsx");
 for(const name of ["Manchester Recovery","Quick Tow Ltd","North West Recovery","£110","£125","£130"])assert.ok(!source.includes(name),name);
 assert.match(source,/No driver offers have been received yet/);
 assert.match(source,/No reviews yet/);
 assert.match(source,/from "react"/);
 assert.match(source,/api\/recovery\/guest-offers/);
 assert.match(source,/api\/recovery\/accept-offer/);
});
test("SS4 query checks HMAC guest proof, exact job, and persisted real offers",()=>{
 const source=read("app/api/recovery/guest-offers/route.ts");
 for(const value of ["validGuestProof","guest_reference","driver_job_offers","driver_profiles","eta_minutes","offer_amount_gbp","approval_status"])
 assert.ok(source.includes(value),value);
 assert.doesNotMatch(source,/recovery_job_private_contacts|customer_phone|customer_email/);
 assert.match(source,/status",\["pending","accepted"\]/);
});
test("existing driver offer acceptance remains atomic and guarded",()=>{
 const sql=read("supabase/migrations/0010_integrated_guest_offer_acceptance.sql");
 assert.match(sql,/for update/);assert.match(sql,/assigned_driver_id is null/);
 assert.match(sql,/revoke all on function public\.accept_guest_recovery_offer/);
});

test("direct marketplace API handlers preserve review-mode blocks",()=>{
 assert.match(read("src/lib/client-review.ts"),/return true/);
 for(const path of ["app/api/recovery/guest-offers/route.ts","app/api/recovery/accept-offer/route.ts","app/api/driver/offers/route.ts"]){
  const source=read(path);
  assert.ok(source.includes("isClientReviewDemo()&&!isIsolatedMarketplaceStaging()"));
  assert.ok(source.includes("status:503"));
 }
});
test("SS3 read-only Continue never promises a real SS4/SS5 booking",()=>{
 const source=read("app/components/estimate-result.tsx");
 for(const phrase of ["Driver Offers","Driver Details","No booking or driver request has been created","Choose This Driver — Unavailable"])assert.ok(source.includes(phrase));
});
