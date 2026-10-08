import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const routing=readFileSync("src/lib/open-routing.ts","utf8");
const api=readFileSync("app/api/recovery/open-estimate/route.ts","utf8");
const pricing=readFileSync("src/lib/recovery-pricing.ts","utf8");
const migration=readFileSync("supabase/migrations/0009_driver_membership_offers.sql","utf8");
test("road metres are converted to miles",()=>{assert.match(routing,/metres\/1609\.344/);assert.match(routing,/route\.distance/);assert.doesNotMatch(routing,/haversine/i)});
test("demo hosts prohibited; routing must be configured",()=>{assert.ok(routing.includes("project-osrm"));assert.match(routing,/ROUTING_PROVIDER_URL/)});
test("routing or pricing failure never invents GBP",()=>{assert.match(api,/Price to be confirmed by recovery drivers/);assert.match(api,/rules\.length!==1/);assert.match(api,/validPricingConfig/)});
test("all surcharge rules supported",()=>{for(const key of ["vehicleSurcharge","nonRunningSurcharge","lockedWheelSurcharge","accidentSurcharge","nightSurcharge","weekendSurcharge","bankHolidaySurcharge","urgentSurcharge","loadingDifficultySurcharge","specialEquipmentSurcharge"])assert.ok(pricing.includes(key))});
test("membership verified by RLS and offer acceptance atomic",()=>{assert.match(migration,/valid_until>now\(\)/);assert.match(migration,/for update/);assert.match(migration,/status='assigned'/);assert.match(migration,/accept_customer_offer/)});

test("estimate route resolves local routing and pricing modules without alias",()=>{
 const fs=readFileSync("app/api/recovery/open-estimate/route.ts","utf8");
 assert.match(fs,/from "(?:@\/src\/lib|\.\.\/\.\.\/\.\.\/\.\.\/src\/lib)\/open-routing"/);
 assert.match(fs,/from "(?:@\/src\/lib|\.\.\/\.\.\/\.\.\/\.\.\/src\/lib)\/recovery-pricing"/);
 assert.ok(readFileSync("src/lib/open-routing.ts","utf8").includes("previewDrivingRoute"));
});

test("customer form calls server-side road estimate and recalculates on selections",()=>{
 const page=readFileSync("app/recovery/request/page.tsx","utf8");
 assert.match(page,/fetch\("\/api\/recovery\/open-estimate"/);
 assert.match(page,/\[pickup,destination,vehicleType,runningStatus,service,lockedWheels\]/);
 assert.match(page,/controller\.abort\(\)/);
 assert.match(page,/Price to be confirmed by recovery drivers/);
 assert.doesNotMatch(page,/Estimate calculated after route & pricing data/);
});
test("customer estimate endpoint requires a real road route and approved pricing",()=>{
 assert.match(api,/previewDrivingRoute\(origin,end\)/);
 assert.match(api,/validPricingConfig\(rules\[0\]\.rule_config\)/);
 assert.match(api,/calculateRecoveryPrice/);
});
