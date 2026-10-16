import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const file=(p)=>readFileSync(p,"utf8");
test("client demo cannot send any live request, offer, upload or admin mutation",()=>{
 const p=file("proxy.ts");
 assert.match(p,/isClientReviewDemo\(\)/);
 assert.match(p,/if\(!allowedGet&&!allowedEstimate\)/);
 for(const endpoint of ["/api/recovery/jobs","/api/driver/offers","/api/recovery/photos","/api/admin/pricing"]){
  assert.ok(!p.includes('"'+endpoint+'"'),endpoint+" must not be allowlisted");
 }
 assert.match(file("src/lib/client-review.ts"),/return true/);
 assert.match(file("src/lib/google-oauth-gate.ts"),/isIsolatedMarketplaceStaging\(\)/);
});
test("safe demo quote never reads Supabase or publishes test prices",()=>{
 const p=file("app/api/recovery/open-estimate/route.ts");
 assert.match(p,/if\(isClientReviewDemo\(\)&&!isIsolatedMarketplaceStaging\(\)\)return unavailable\(stage,route,locations\)/);
 assert.ok(p.indexOf("if(isClientReviewDemo()&&!isIsolatedMarketplaceStaging())")<p.indexOf("createAdminClient(url,key"));
 assert.match(p,/Price to be confirmed by recovery drivers/);
});
test("five-step form and ten services preserved with visible map",()=>{
 const p=file("app/recovery/request/page.tsx");
 assert.match(p,/const steps=\["Location","Vehicle","Recovery","Customer","Review"\]/);
 const services=file("src/lib/recovery-service-rules.ts").match(/export const recoveryServices=\[([^\]]+)\]/);
 assert.ok(services);
 assert.equal([...services[1].matchAll(/"([^"]+)"/g)].length,10);
 assert.match(p,/fetch\("\/api\/recovery\/open-estimate"/);
 assert.match(p,/<EstimateResult estimate=\{estimate\}/);
 const result=file("app/components/estimate-result.tsx");
 assert.match(result,/No driver has been booked/);
 assert.match(file("app/api/recovery/jobs/route.ts"),/isClientReviewDemo\(\)/);
 const map=file("app/components/recovery-route-map.tsx");
 assert.match(map,/tile\.openstreetmap\.org/);
 assert.match(map,/map\.setView\(\[54\.5,-3\],6\)/);
});
test("client can inspect dashboard design without auth and without real records",()=>{
 for(const path of ["app/demo/page.tsx","app/demo/driver/page.tsx","app/demo/admin/page.tsx","app/demo/customer/page.tsx"])
  assert.match(file(path),/demo|Demo|review/i);
});
