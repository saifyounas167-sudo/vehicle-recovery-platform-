import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
test("Staging gate is pinned, fail closed and never requires Production service-role credentials",()=>{
 const s=read("src/lib/driver-registration-gate.ts");
 for(const x of ["ozphvosiqbzvkthlppkd","eosrparfgrycdnykekcn","VERCEL_ENV","VERCEL_GIT_COMMIT_REF","MARKETPLACE_STAGING_MODE","STAGING_SUPABASE_URL","STAGING_SUPABASE_SERVICE_ROLE_KEY","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","isIsolatedMarketplaceStaging",'registrationEnabled:configured&&publishable==="passed"&&service==="passed"']) assert.ok(s.includes(x),x);
 assert.doesNotMatch(s,/PRODUCTION_SUPABASE_SERVICE_ROLE_KEY/);
});
test("Status GET bypasses read-only proxy but marketplace operations remain protected",()=>{
 const p=read("proxy.ts");
 assert.match(p,/"\/api\/driver\/registration-status"/);
 assert.match(p,/"\/api\/driver\/registration-diagnostics"/);
 assert.match(p,/if\(!allowedGet&&!allowedEstimate\)/);
 assert.doesNotMatch(p,/"\/api\/recovery\/jobs"|"\/api\/driver\/offers"/);
});
test("Diagnostic response is Admin-only and contains no secrets",()=>{
 const p=read("app/api/driver/registration-diagnostics/route.ts");
 assert.match(p,/requireRole\("admin"\)/);
 assert.match(p,/getDriverRegistrationGateDiagnostics/);
 assert.match(p,/VERCEL_ENV/);assert.match(p,/isDriverOnboardingPreviewBranch/);
 assert.doesNotMatch(p,/SUPABASE_SERVICE_ROLE_KEY|apiKey|secret:/);
 const d=read("src/lib/driver-registration-gate.ts");
 assert.match(d,/providerVerification:\{publishable,service\}/);
 assert.match(d,/res.status===401\|\|res.status===403/);
});
