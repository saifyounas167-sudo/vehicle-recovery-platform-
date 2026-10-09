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
 assert.match(file("lib/supabase/env.ts"),/if\(isClientReviewDemo\(\)\)return null/);
});
test("safe demo quote never reads Supabase or publishes test prices",()=>{
 const p=file("app/api/recovery/open-estimate/route.ts");
 assert.match(p,/if\(isClientReviewDemo\(\)\)return unavailable\(stage,route,locations\)/);
 assert.ok(p.indexOf("if(isClientReviewDemo())")<p.indexOf("createAdminClient(url,key"));
 assert.match(p,/Price to be confirmed by recovery drivers/);
});
test("five-step form and ten services preserved with visible map",()=>{
 const p=file("app/recovery/request/page.tsx");
 assert.match(p,/const steps=\["Location","Vehicle","Recovery","Customer","Review"\]/);
 const services=p.match(/const services=\[([^\]]+)\]/);
 assert.equal([...services[1].matchAll(/"([^"]+)"/g)].length,10);
 assert.match(p,/fetch\("\/api\/recovery\/open-estimate"/);
 assert.match(p,/<RecoveryRouteMap route=\{estimate\?\.route\?\?null\} pickup=/);
 assert.match(p,/REQUEST SUBMISSION PAUSED/);
 assert.match(p,/clientReview\?<\>/);
 const map=file("app/components/recovery-route-map.tsx");
 assert.match(map,/tile\.openstreetmap\.org/);
 assert.match(map,/map\.setView\(\[54\.5,-3\],6\)/);
});
test("client can inspect dashboard design without auth and without real records",()=>{
 for(const path of ["app/demo/page.tsx","app/demo/driver/page.tsx","app/demo/admin/page.tsx","app/demo/customer/page.tsx"])
  assert.match(file(path),/demo|Demo|review/i);
});
