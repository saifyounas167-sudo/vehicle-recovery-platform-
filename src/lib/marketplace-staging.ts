/** Explicit opt-in for a separate disposable Supabase staging project.
 * Default is fail closed. Production cannot enable this, even with wrong flags.
 * Do not use preview credentials pointing at the Production database.
 */
export function isIsolatedMarketplaceStaging():boolean{
 if(process.env.VERCEL_ENV==="production"||process.env.NODE_ENV==="production"&&process.env.VERCEL_ENV!=="preview")return false;
 if(process.env.MARKETPLACE_STAGING_MODE!=="enabled")return false;
 const configured=process.env.NEXT_PUBLIC_SUPABASE_URL,staging=process.env.STAGING_SUPABASE_URL,production=process.env.PRODUCTION_SUPABASE_URL;
 if(!configured||!staging||!production||configured!==staging||configured===production)return false;
 try{
  const url=new URL(configured);
  return url.protocol==="https:"&&url.hostname.endsWith(".supabase.co");
 }catch{return false;}
}
