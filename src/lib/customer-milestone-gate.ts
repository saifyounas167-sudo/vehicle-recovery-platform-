/** Narrow Customer + Admin demo: no Driver marketplace, payment or Production writes. */
export function customerMilestoneStagingEnabled():boolean{
 const e=process.env;
 return e.VERCEL_ENV==="preview"
  &&e.VERCEL_GIT_COMMIT_REF==="integration/staging-recovery-pr56-pr55-pr70"
  &&e.CUSTOMER_MILESTONE_STAGING_ENABLED==="enabled"
  &&e.NEXT_PUBLIC_SUPABASE_URL==="https://ozphvosiqbzvkthlppkd.supabase.co"
  &&e.STAGING_SUPABASE_URL==="https://ozphvosiqbzvkthlppkd.supabase.co"
  &&e.PRODUCTION_SUPABASE_URL==="https://eosrparfgrycdnykekcn.supabase.co"
  &&!!e.SUPABASE_SERVICE_ROLE_KEY
  &&e.SUPABASE_SERVICE_ROLE_KEY===e.STAGING_SUPABASE_SERVICE_ROLE_KEY
  &&!!e.GUEST_REQUEST_HASH_SECRET&&e.GUEST_REQUEST_HASH_SECRET.length>=32;
}
