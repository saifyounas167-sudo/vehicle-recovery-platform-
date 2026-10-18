import test from "node:test";
import assert from "node:assert/strict";
import{readFileSync}from"node:fs";
const f=p=>readFileSync(p,"utf8");
test("each protected dashboard exposes account controls",()=>{
 for(const role of ["driver","customer","admin"]){
  const s=f("app/"+role+"/page.tsx");
  if(role==="customer"){
   assert.match(s,/CustomerFrame/);
   assert.match(f("app/customer/customer-frame.tsx"),/AccountNavigation/);
  }else assert.match(s,/AccountNavigation/);
  assert.ok(s.includes('requireRole("'+role+'")'));
 }
});
test("production OAuth uses separate opt-in and pins production project",()=>{
 const s=f("src/lib/google-oauth-gate.ts");
 for(const v of ["ENABLE_GOOGLE_OAUTH_PRODUCTION","GOOGLE_OAUTH_PRODUCTION_APPROVED","PRODUCTION_PROJECT",'VERCEL_ENV==="production"',"VERCEL_GIT_COMMIT_REF"])assert.ok(s.includes(v),v);
});
test("marketplace write restrictions still remain",()=>{
 const s=f("proxy.ts");
 assert.ok(s.includes("if(!allowedGet&&!allowedEstimate)"));
 assert.ok(f("src/lib/marketplace-staging.ts").includes("STAGING_SUPABASE_SERVICE_ROLE_KEY"));
});
