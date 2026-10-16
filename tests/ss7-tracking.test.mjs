import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("SS7 uses persisted booking/accepted offer and never fabricates GPS",()=>{
 const api=read("app/api/recovery/tracking/[jobId]/route.ts");
 for(const term of ["assigned_driver_id","guest_reference","validGuestProof","customer_id","accepted","driver_profiles","truck_type","eta_minutes","pickup_latitude","no-store","trackingAvailable:false","driverLocation:null","liveEtaMinutes:null"])assert.ok(api.includes(term),term);
 assert.match(api,/isClientReviewDemo\(\)&&!isIsolatedMarketplaceStaging\(\)/);
 assert.doesNotMatch(api,/coverage_latitude|coverage_longitude/);
});
test("SS7 display correctly labels original offered ETA and unavailable live tracking",()=>{
 const page=read("app/recovery/tracking/[jobId]/page.tsx");
 assert.match(page,/Original estimate, not live arrival time/);
 assert.match(page,/Live GPS unavailable/);
 assert.match(page,/No live booking, driver location, route or ETA is being simulated/);
 assert.match(page,/tracking\.driver\.phone\?/);
 assert.match(page,/ukr-ss6-guest-access/);
 assert.doesNotMatch(page,/Math\.random|setInterval/);
});
test("SS7 keeps production read-only proxy unchanged",()=>{
 const proxy=read("proxy.ts");
 assert.match(proxy,/if\(!allowedGet&&!allowedEstimate\)/);
 assert.doesNotMatch(proxy,/\/api\/recovery\/tracking/);
 const clientReview=read("src/lib/client-review.ts");
 assert.match(clientReview,/return true/);
});

test("SS6 links to SS7 only after accepted verified booking",()=>{
 const source=read("app/recovery/booking/page.tsx");
 assert.match(source,/setTrackingJobId\(data\.jobId\)/);
 assert.match(source,/state==="confirmed"&&booking&&trackingJobId/);
 assert.match(source,/\/recovery\/tracking\//);
});
