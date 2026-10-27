import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("Registration status remains readable even when onboarding is disabled",()=>{
 const proxy=read("proxy.ts");
 assert.match(proxy,/"\/api\/driver\/registration-status"/);
 assert.match(proxy,/if\(!allowedGet&&!allowedEstimate\)/);
 const status=read("app/api/driver/registration-status/route.ts");
 assert.match(status,/await isDriverRegistrationEnabled\(\)/);
});
test("nonsecret diagnostics are admin-only, preview-only and require role verification",()=>{
 const route=read("app/api/driver/staging-diagnostics/route.ts");
 for(const x of ["VERCEL_ENV","DRIVER_ONBOARDING_BRANCH",'auth.getUser()','select("role")','profile?.role!=="admin"',"getDriverRegistrationGateDiagnostics","no-store"])assert.ok(route.includes(x),x);
 assert.doesNotMatch(route,/SERVICE_ROLE_KEY|console\.log|JSON\.stringify\(process\.env\)/);
});
test("Onboarding gate fails closed and does not enable general marketplace writes",()=>{
 const gate=read("src/lib/driver-registration-gate.ts");
 for(const x of ["ozphvosiqbzvkthlppkd","eosrparfgrycdnykekcn","generalMarketplaceGateClosed","providerVerification","registrationEnabled:configured&&publishable","AbortSignal.timeout"])assert.ok(gate.includes(x),x);
 const proxy=read("proxy.ts");
 for(const p of ["/api/recovery/jobs","/api/driver/offers","/api/admin/pricing","/api/customer/accept-offer"])assert.ok(!proxy.includes('"'+p+'"'),p);
});
