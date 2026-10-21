import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
for(const p of ["app/api/admin/pricing/route.ts","app/api/customer/accept-offer/route.ts","app/api/recovery/photos/route.ts"]){
 test(p+" independently blocks client-review writes",()=>{
 const s=read(p);assert.match(s,/isClientReviewDemo\(\)&&!isIsolatedMarketplaceStaging\(\)/);
 assert.match(s,/Marketplace writes are paused for client review/);
 assert.ok(s.indexOf("if(isClientReviewDemo()")<s.indexOf("await request.json()")||s.indexOf("if(isClientReviewDemo()")<s.indexOf("await req.json()")||s.indexOf("if(isClientReviewDemo()")<s.indexOf("await request.formData()"));
 });
}
