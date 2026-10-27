import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import ts from "typescript";

const source=readFileSync("src/lib/driver-registration-gate.ts","utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const safe={
 VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"feature/ss8-driver-approval-inbox-secure",
 MARKETPLACE_STAGING_MODE:"enabled",
 DRIVER_ONBOARDING_STAGING_ENABLED:"disabled",
 NEXT_PUBLIC_SUPABASE_URL:"https://ozphvosiqbzvkthlppkd.supabase.co",
 STAGING_SUPABASE_URL:"https://ozphvosiqbzvkthlppkd.supabase.co",
 PRODUCTION_SUPABASE_URL:"https://eosrparfgrycdnykekcn.supabase.co",
 SUPABASE_SERVICE_ROLE_KEY:"staging-secret-token",
 STAGING_SUPABASE_SERVICE_ROLE_KEY:"staging-secret-token",
 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"staging-publishable-token"
};
function gate(overrides={},verify=async()=>({ok:true}),marketplace=false){
 const env={...safe,...overrides},calls=[];
 const context={exports:{},process:{env},
  require:(name)=>{assert.equal(name,"./marketplace-staging");return {isIsolatedMarketplaceStaging:()=>marketplace};},
  fetch:async(url,opts)=>{calls.push({url,key:opts.headers.apikey});return verify(url,opts);},
  AbortSignal:{timeout:()=>({})}
 };
 runInNewContext(js,context);
 return {...context.exports,calls};
}
test("only pinned isolated branch and project may enable onboarding",()=>{
 assert.equal(gate().isDriverRegistrationConfigured(),true);
 assert.equal(gate({VERCEL_GIT_COMMIT_REF:"integration/staging-recovery-pr56-pr55-pr70",MARKETPLACE_STAGING_MODE:"disabled",DRIVER_ONBOARDING_STAGING_ENABLED:"enabled"}).isDriverRegistrationConfigured(),true);
 assert.equal(gate({VERCEL_GIT_COMMIT_REF:"integration/staging-recovery-pr56-pr55-pr70",MARKETPLACE_STAGING_MODE:"disabled"}).isDriverRegistrationConfigured(),false);
 assert.equal(gate({VERCEL_GIT_COMMIT_REF:"integration/staging-recovery-pr56-pr55-pr70",DRIVER_ONBOARDING_STAGING_ENABLED:"enabled"}).isDriverRegistrationConfigured(),false);
 for(const vars of [
 {VERCEL_ENV:"production"},{VERCEL_ENV:"development"},{VERCEL_GIT_COMMIT_REF:"main"},
 {MARKETPLACE_STAGING_MODE:"disabled"},
 {NEXT_PUBLIC_SUPABASE_URL:"https://eosrparfgrycdnykekcn.supabase.co"},
 {NEXT_PUBLIC_SUPABASE_URL:"https://eosprarfgrydnykekcn.supabase.co"},
 {STAGING_SUPABASE_URL:"https://eosrparfgrycdnykekcn.supabase.co"},
 {PRODUCTION_SUPABASE_URL:"https://ozphvosiqbzvkthlppkd.supabase.co"},
 {PRODUCTION_SUPABASE_URL:undefined},
 {SUPABASE_SERVICE_ROLE_KEY:undefined},{STAGING_SUPABASE_SERVICE_ROLE_KEY:undefined},
 {SUPABASE_SERVICE_ROLE_KEY:"wrong"},{NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:undefined}
 ])assert.equal(gate(vars).isDriverRegistrationConfigured(),false,JSON.stringify(vars));
 assert.equal(gate({},undefined,true).isDriverRegistrationConfigured(),false,"general marketplace gate must stay closed");
});
test("Staging provider validates both independent keys before any onboarding write",async()=>{
 const g=gate();assert.equal(await g.isDriverRegistrationEnabled(),true);
 assert.equal(g.calls.length,2);assert.ok(g.calls.every(c=>c.url==="https://ozphvosiqbzvkthlppkd.supabase.co/auth/v1/settings"));
 const denied=gate({},async(_url,options)=>({ok:options.headers.apikey!=="staging-secret-token"}));
 assert.equal(await denied.isDriverRegistrationEnabled(),false);
 const unavailable=gate({},async()=>{throw Error("provider unavailable")});
 assert.equal(await unavailable.isDriverRegistrationEnabled(),false);
 const prod=gate({VERCEL_ENV:"production"});assert.equal(await prod.isDriverRegistrationEnabled(),false);assert.equal(prod.calls.length,0);
});
test("No Production service-role key required; marketplace writes remain locked",()=>{
 assert.doesNotMatch(source,/PRODUCTION_SUPABASE_SERVICE_ROLE_KEY/);
 const p=readFileSync("proxy.ts","utf8");
 assert.match(p,/onboardingGet/);assert.match(p,/onboardingWrite/);
 assert.match(p,/await isDriverRegistrationEnabled\(\)/);
 assert.match(p,/if\(!allowedGet&&!allowedEstimate\)/);
 for(const route of ["/api/recovery/jobs","/api/driver/offers","/api/admin/pricing","/api/customer/accept-offer"])
 assert.doesNotMatch(p,new RegExp('"'+route+'"'),route);
 const status=readFileSync("app/api/client-review-status/route.ts","utf8");
 assert.match(status,/writesEnabled:false/);assert.match(status,/isolatedStaging:false/);assert.match(status,/driverRegistrationEnabled/);
});
