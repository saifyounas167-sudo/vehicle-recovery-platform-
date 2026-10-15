import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {calculateEstimate} from "../src/lib/pricing.ts";
const read=p=>readFileSync(p,"utf8");
test("approved £5 callout plus £3 per verified road mile, pence rounding",()=>{
 const quote=m=>calculateEstimate({baseFee:5,distanceMiles:m,distanceRate:3});
 for(const [m,expected] of [[0,5],[5,20],[10,35],[20,65],[0.1,5.3],[1.235,8.71]])assert.equal(quote(m).estimateGbp,expected);
});
test("staging-only approved initial configuration; no unapproved surcharges",()=>{
 const sql=read("supabase/test-seeds/screenshot2-approved-pricing-staging.sql");
 assert.match(sql,/minimumCallout',5\.00,'pricePerMile',3\.00/);
 assert.match(sql,/STAGING \/ isolated development ONLY/);
 assert.match(sql,/Existing active pricing rule detected/);
 for(const name of ["vehicleSurcharge","nonRunningSurcharge","lockedWheelSurcharge","accidentSurcharge","nightSurcharge","weekendSurcharge","bankHolidaySurcharge","urgentSurcharge","loadingDifficultySurcharge","specialEquipmentSurcharge"])assert.ok(sql.includes("'"+name+"',0"),name);
});
test("route estimate remains server-authoritative, no fabricated miles or client-demo prices",()=>{
 const api=read("app/api/recovery/open-estimate/route.ts");
 assert.match(api,/previewDrivingRoute\(origin,end\)/);
 assert.match(api,/if\(isClientReviewDemo\(\)&&!isIsolatedMarketplaceStaging\(\)\)return unavailable/);
 assert.match(api,/calculateRecoveryPrice\(cfg,route.distanceMiles/);
 assert.match(api,/Price to be confirmed by recovery drivers/);
 const guard=read("proxy.ts");
 assert.match(guard,/isClientReviewDemo\(\)/);
 assert.match(guard,/!allowedGet&&!allowedEstimate/);
 assert.match(guard,/status:503/);
});
test("Admin pricing writes require role and demo remains blocked",()=>{
 const api=read("app/api/admin/pricing/route.ts");
 assert.match(api,/profile\?\.role!=="admin"/);
 assert.match(api,/validPricingConfig\(input.ruleConfig\)/);
 const guard=read("proxy.ts");
 assert.ok(!guard.includes('"/api/admin/pricing"'));
});
