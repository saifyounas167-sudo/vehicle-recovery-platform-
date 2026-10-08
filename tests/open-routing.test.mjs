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
 assert.match(page,/\[step,v\]/);
 assert.match(page,/controller\.abort\(\)/);
 assert.match(page,/Price to be confirmed by recovery drivers/);
 assert.doesNotMatch(page,/Estimate calculated after route & pricing data/);
});
test("customer estimate endpoint requires a real road route and approved pricing",()=>{
 assert.match(api,/previewDrivingRoute\(origin,end\)/);
 assert.match(api,/validPricingConfig\(rules\[0\]\.rule_config\)/);
 assert.match(api,/calculateRecoveryPrice/);
});

test("preview exposes commit id without leaking secrets",()=>{
 const info=readFileSync("app/api/build-info/route.ts","utf8");
 assert.match(info,/VERCEL_GIT_COMMIT_SHA/);
 assert.doesNotMatch(info,/ORS_API_KEY|SUPABASE_SERVICE_ROLE_KEY/);
});

test("five-step wizard retains guest data and shows real route pricing",()=>{
 const page=readFileSync("app/recovery/request/page.tsx","utf8");
 assert.match(page,/const steps=\["Location","Vehicle","Recovery","Customer","Review"\]/);
 assert.match(page,/registration:""/);
 assert.match(page,/customerName:""/);
 assert.match(page,/setV\(s=>\(\{\.\.\.s,\[key\]:value\}\)\)/);
 assert.match(page,/fetch\("\/api\/recovery\/open-estimate"/);
 assert.match(page,/estimatedPriceGbp/);
 assert.match(page,/<RecoveryRouteMap route=\{estimate\.route\}/);
 assert.match(page,/fetch\("\/api\/recovery\/jobs"/);
});
test("server-only price and secure offer checks stay required",()=>{
 const api=readFileSync("app/api/recovery/open-estimate/route.ts","utf8");
 const offer=readFileSync("app/api/driver/offers/route.ts","utf8");
 assert.match(api,/SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(api,/validPricingConfig/);
 assert.match(offer,/driver_memberships/);
 assert.match(offer,/approval_status/);
});

test("safe stage-specific estimate diagnostics, no secrets or customer data in logs",()=>{
 const source=readFileSync("app/api/recovery/open-estimate/route.ts","utf8");
 for(const stage of ["postcode","routing","pricing_query","pricing_config","holiday","calculation"])assert.ok(source.includes(stage));
 assert.match(source,/console\.warn\("\[recovery-estimate\]"/);
 assert.match(source,/diagnosticStage:stage/);
 assert.doesNotMatch(source,/console\.(?:log|warn|error)\([^\n]*(?:pickup|destination|request\.headers|ORS_API_KEY)/);
});
test("zero bank-holiday surcharge removes external calendar dependency",()=>{
 const source=readFileSync("app/api/recovery/open-estimate/route.ts","utf8");
 assert.match(source,/cfg\.bankHolidaySurcharge>0\?await ukHoliday\(day,pickup\):false/);
 assert.match(source,/return unavailable\(stage,route\)/);
});

test("integrated guest acceptance locks job and checks live membership",()=>{
 const sql=readFileSync("supabase/migrations/0010_integrated_guest_offer_acceptance.sql","utf8");
 assert.match(sql,/accept_guest_recovery_offer\(p_job_id uuid,p_offer_id uuid\)/);
 assert.match(sql,/where id=p_job_id for update/);
 assert.match(sql,/dm\.valid_until>now\(\)/);
 assert.match(sql,/dp\.approval_status='approved'/);
 assert.match(sql,/revoke all on function public\.accept_guest_recovery_offer\(uuid,uuid\) from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.accept_guest_recovery_offer\(uuid,uuid\) to service_role/);
});

test("legacy estimate endpoint uses the same ORS pricing source of truth",()=>{
 const legacy=readFileSync("app/api/recovery/estimate/route.ts","utf8");
 assert.match(legacy,/POST as calculateOpenEstimate/);
 assert.match(legacy,/await calculateOpenEstimate\(original\)/);
 assert.match(legacy,/estimateGbp:data\.estimatedPriceGbp/);
 assert.doesNotMatch(legacy,/calculateEstimate\(/);
});

test("temporary Preview-only rule cannot be used for production GBP quotes",()=>{
 const api=readFileSync("app/api/recovery/open-estimate/route.ts","utf8");
 assert.match(api,/VERCEL_ENV==="production"/);
 assert.match(api,/temporary_rates_prohibited_in_production/);
 assert.match(api,/select\("name,rule_config"\)/);
});
