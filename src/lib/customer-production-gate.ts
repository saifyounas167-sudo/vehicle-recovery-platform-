/** Production Customer/Admin milestone only. Explicit opt-in, never Staging. */
export function customerMilestoneProductionEnabled(): boolean {
 const e=process.env;
 return e.VERCEL_ENV==="production"
  && e.CUSTOMER_ADMIN_PRODUCTION_ENABLED==="enabled"
  && e.NEXT_PUBLIC_SUPABASE_URL==="https://eosrparfgrycdnykekcn.supabase.co"
  && e.PRODUCTION_SUPABASE_URL===e.NEXT_PUBLIC_SUPABASE_URL
  && Boolean(e.SUPABASE_SERVICE_ROLE_KEY)
  && Boolean(e.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY)
  && e.SUPABASE_SERVICE_ROLE_KEY===e.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY
  && Boolean(e.GUEST_REQUEST_HASH_SECRET&&e.GUEST_REQUEST_HASH_SECRET.length>=32);
}
