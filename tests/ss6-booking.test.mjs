import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(p,"utf8");
test("SS6 never confirms on button click alone",()=>{
 const page=read("app/recovery/booking/page.tsx");
 assert.match(page,/info\.confirmed===true&&info\.booking/);
 assert.match(page,/state==="confirmed"&&booking/);
 assert.match(page,/Booking Confirmation Preview/);
 assert.match(page,/No recovery has been booked/);
 assert.match(page,/Booking Pending/);
 assert.match(page,/Booking Unavailable/);
 assert.match(page,/No payment has been taken/);
 assert.match(page,/Pay your recovery driver directly|paymentMethod/);
});
test("SS6 server enforces guest capability and persisted accepted job+offer",()=>{
 const api=read("app/api/recovery/booking-confirmation/route.ts");
 for(const term of ["validGuestProof","guest_reference","assigned_driver_id","driver_job_offers","status\",\"accepted\"","offer_amount_gbp","eta_minutes","recovery_type"])assert.ok(api.includes(term),term);
 assert.match(api,/isClientReviewDemo\(\)&&!isIsolatedMarketplaceStaging\(\)/);
 assert.match(api,/\.eq\("status","accepted"\)/);
 assert.match(api,/\.eq\("driver_id",job\.assigned_driver_id\)/);
 assert.match(api,/\.eq\("job_id",job\.id\)/);
 assert.doesNotMatch(api,/recovery_job_private_contacts/);
});
test("SS5 navigates only after server acceptance and does not use URL capability",()=>{
 const source=read("app/components/customer-driver-offers.tsx");
 assert.match(source,/result\.accepted!==true/);
 assert.match(source,/sessionStorage\.setItem\("ukr-ss6-guest-access"/);
 assert.match(source,/router\.push\("\/recovery\/booking"\)/);
 assert.ok(source.indexOf("result.accepted!==true")<source.indexOf("router.push"));
 assert.doesNotMatch(source,/\?proof=|\?jobId=/);
});
test("SS6 detail destination exists and is same guarded view",()=>{
 const page=read("app/recovery/booking/page.tsx");
 const dest=read("app/recovery/booking/details/page.tsx");
 assert.match(page,/href="\/recovery\/booking\/details"/);
 assert.match(page,/href="\/"/);
 assert.match(dest,/export \{default\} from "\.\.\/page"/);
});
test("SS6 read-only proxy is unchanged and blocks booking API",()=>{
 const proxy=read("proxy.ts"),guard=read("src/lib/client-review.ts");
 assert.match(guard,/return true/);
 assert.match(proxy,/if\(!allowedGet&&!allowedEstimate\)/);
 assert.doesNotMatch(proxy,/\/api\/recovery\/booking-confirmation/);
});
