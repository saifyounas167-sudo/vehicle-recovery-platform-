import {isIsolatedMarketplaceStaging} from "./marketplace-staging";

const STAGING="https://ozphvosiqbzvkthlppkd.supabase.co";
const PRODUCTION="https://eosprarfgrydnykekcn.supabase.co";
const BRANCH="feature/ss8-driver-approval-inbox-secure";

/** Scoped to Driver onboarding, NOT the marketplace staging write gate. */
export function isDriverRegistrationConfigured():boolean{
 const e=process.env;
 return e.VERCEL_ENV==="preview"&&e.VERCEL_GIT_COMMIT_REF===BRANCH
  &&e.MARKETPLACE_STAGING_MODE==="enabled"
  &&e.NEXT_PUBLIC_SUPABASE_URL===STAGING
  &&e.STAGING_SUPABASE_URL===STAGING
  &&e.PRODUCTION_SUPABASE_URL===PRODUCTION
  &&!!e.STAGING_SUPABASE_SERVICE_ROLE_KEY
  &&e.SUPABASE_SERVICE_ROLE_KEY===e.STAGING_SUPABASE_SERVICE_ROLE_KEY
  &&!!e.STAGING_SUPABASE_PUBLISHABLE_KEY
  &&e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY===e.STAGING_SUPABASE_PUBLISHABLE_KEY
  &&!isIsolatedMarketplaceStaging();
}
/** Verify both keys against the pinned Staging provider, not merely names. No secrets are logged. */
export async function isDriverRegistrationEnabled():Promise<boolean>{
 if(!isDriverRegistrationConfigured())return false;
 try{
  const keys=[process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY!,process.env.STAGING_SUPABASE_PUBLISHABLE_KEY!];
  const results=await Promise.all(keys.map(key=>fetch(STAGING+"/auth/v1/settings",{
   headers:{apikey:key},cache:"no-store",signal:AbortSignal.timeout(4000)
  })));
  return results.every(r=>r.ok);
 }catch{return false;}
}
