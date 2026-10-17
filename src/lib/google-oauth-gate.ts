/**
 * Auth-only staging gate. Never call marketplace staging gate here:
 * that gate requires service-role secrets and may enable marketplace writes.
 * Project IDs are public identifiers, NOT credentials.
 */
const STAGING_PROJECT="ozphvosiqbzvkthlppkd";
const PRODUCTION_PROJECT="eosprarfgrydnykekcn";
export function googleOAuthEnabled(){
 if(process.env.VERCEL_ENV==="production"){
  if(process.env.ENABLE_GOOGLE_OAUTH_PRODUCTION!=="enabled"||
     process.env.GOOGLE_OAUTH_PRODUCTION_APPROVED!=="approved")return false;
  const expected="https://"+PRODUCTION_PROJECT+".supabase.co";
  if(process.env.NEXT_PUBLIC_SUPABASE_URL!==expected)return false;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
 }

 if(process.env.VERCEL_ENV!=="preview")return false;
 if(process.env.VERCEL_GIT_COMMIT_REF!=="feature/google-oauth-secure-staging")return false;
 if(process.env.MARKETPLACE_STAGING_MODE!=="enabled"||process.env.ENABLE_GOOGLE_OAUTH_STAGING!=="enabled")return false;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const expected=process.env.STAGING_SUPABASE_URL;
 const production=process.env.PRODUCTION_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const expectedKey=process.env.STAGING_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!expected||!production||!key||!expectedKey||key!==expectedKey)return false;
 try{
  const stagingHost=STAGING_PROJECT+".supabase.co";
  const productionHost=PRODUCTION_PROJECT+".supabase.co";
  const configured=new URL(url),approved=new URL(expected),live=new URL(production);
  return configured.protocol==="https:"&&approved.protocol==="https:"&&live.protocol==="https:"
   &&configured.hostname===stagingHost&&approved.hostname===stagingHost
   &&live.hostname===productionHost&&configured.origin===approved.origin
   &&configured.pathname==="/"&&approved.pathname==="/"&&live.pathname==="/"
   &&configured.username===""&&configured.password===""
   &&approved.username===""&&approved.password===""
   &&live.username===""&&live.password===""
   &&configured.search===""&&configured.hash===""
   &&approved.search===""&&approved.hash===""&&live.search===""&&live.hash===""
;
 }catch{return false}
}
export type LoginRole="driver"|"customer"|"admin";
export function validLoginRole(role:string|null):LoginRole|null{
 return role==="driver"||role==="customer"||role==="admin"?role:null;
}
export function roleDestination(role:LoginRole){return "/"+role}
