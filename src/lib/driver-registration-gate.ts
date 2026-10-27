import {isIsolatedMarketplaceStaging} from "./marketplace-staging";

const STAGING="https://ozphvosiqbzvkthlppkd.supabase.co";
const PRODUCTION="https://eosrparfgrycdnykekcn.supabase.co";
export const DRIVER_ONBOARDING_BRANCH="feature/ss8-driver-approval-inbox-secure";
export const DRIVER_ONBOARDING_INTEGRATION_BRANCH="integration/staging-recovery-pr56-pr55-pr70";
export const isDriverOnboardingPreviewBranch=()=>[DRIVER_ONBOARDING_BRANCH,DRIVER_ONBOARDING_INTEGRATION_BRANCH].includes(process.env.VERCEL_GIT_COMMIT_REF||"");

/**
 * Onboarding ONLY: never turn on the general marketplace staging gate.
 * Checks contain booleans only; no credential, URL or response body is exposed.
 */
export function driverRegistrationChecks():Record<string,boolean>{
 const e=process.env;
 const service=e.SUPABASE_SERVICE_ROLE_KEY;
 const publishable=e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 return {
  previewEnvironment:e.VERCEL_ENV==="preview",
  correctPreviewBranch:isDriverOnboardingPreviewBranch(),
  explicitStagingOptIn:e.VERCEL_GIT_COMMIT_REF===DRIVER_ONBOARDING_INTEGRATION_BRANCH
   ?e.DRIVER_ONBOARDING_STAGING_ENABLED==="enabled"&&e.MARKETPLACE_STAGING_MODE!=="enabled"
   :e.MARKETPLACE_STAGING_MODE==="enabled",
  activeProjectIsStaging:e.NEXT_PUBLIC_SUPABASE_URL===STAGING,
  stagingProjectIsPinned:e.STAGING_SUPABASE_URL===STAGING,
  productionProjectIsSeparate:e.PRODUCTION_SUPABASE_URL===PRODUCTION,
  stagingServiceKeyPresent:!!e.STAGING_SUPABASE_SERVICE_ROLE_KEY,
  serviceKeyMatchesStaging:!!service&&service===e.STAGING_SUPABASE_SERVICE_ROLE_KEY,
  serviceKeyTypeSafe:!!service&&!service.startsWith("sb_publishable_"),
  publishableKeyPresent:!!publishable,
  publishableKeyTypeSafe:!!publishable&&!publishable.startsWith("sb_secret_"),
  generalMarketplaceGateClosed:!isIsolatedMarketplaceStaging()
 };
}

export function isDriverRegistrationConfigured():boolean{
 return Object.values(driverRegistrationChecks()).every(Boolean);
}

type ProviderCheck="passed"|"rejected"|"unavailable"|"not_checked";

/** Provider verifies apikey against the pinned Staging project. */
async function verifyStagingKey(key:string):Promise<ProviderCheck>{
 try{
  const res=await fetch(STAGING+"/auth/v1/settings",{
   method:"GET",headers:{apikey:key},
   cache:"no-store",signal:AbortSignal.timeout(4500)
  });
  if(res.ok)return "passed";
  return res.status===401||res.status===403?"rejected":"unavailable";
 }catch{return "unavailable";}
}

export async function getDriverRegistrationGateDiagnostics(){
 const checks=driverRegistrationChecks();
 const configured=Object.values(checks).every(Boolean);
 let publishable:ProviderCheck="not_checked",service:ProviderCheck="not_checked";
 if(configured){
  [publishable,service]=await Promise.all([
   verifyStagingKey(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!),
   verifyStagingKey(process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY!)
  ]);
 }
 return {
  checks,
  providerVerification:{publishable,service},
  registrationEnabled:configured&&publishable==="passed"&&service==="passed"
 };
}

/** Fail closed on missing/incorrect runtime settings, wrong project or provider denial. */
export async function isDriverRegistrationEnabled():Promise<boolean>{
 return (await getDriverRegistrationGateDiagnostics()).registrationEnabled;
}
