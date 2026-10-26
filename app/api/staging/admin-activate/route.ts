import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {serverDb} from "@/src/lib/guest-access";
import {createHash,timingSafeEqual} from "node:crypto";
export const dynamic="force-dynamic";
const STAGING="https://ozphvosiqbzvkthlppkd.supabase.co";
const PRODUCTION="https://eosrparfgrycdnykekcn.supabase.co";
const BRANCH="feature/ss8-driver-approval-inbox-secure";
const EMAIL="saifyounas112@gmail.com";
const fail=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
/**
 * One-time account activation is committed atomically in the database RPC.
 * Never change profiles.role from the browser or ignore s8_protect_role().
 * The RPC is NOT installed automatically by this branch.
 */
export async function POST(req:Request){
 if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!==BRANCH||
  process.env.NEXT_PUBLIC_SUPABASE_URL!==STAGING||process.env.STAGING_SUPABASE_URL!==STAGING||
  process.env.PRODUCTION_SUPABASE_URL!==PRODUCTION||
  process.env.STAGING_ADMIN_ACTIVATION_ENABLED!=="enabled")return fail("Unavailable",404);
 const pinnedId=process.env.STAGING_ADMIN_USER_ID;
 const digest=process.env.STAGING_ADMIN_SETUP_TOKEN_SHA256;
 const invalidSetupNames=[
  ...(!pinnedId||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(pinnedId)?["STAGING_ADMIN_USER_ID"]:[]),
  ...(!digest||!/^[a-f0-9]{64}$/i.test(digest)?["STAGING_ADMIN_SETUP_TOKEN_SHA256"]:[])
 ];
 if(invalidSetupNames.length){
  // Log variable NAMES only. Do not log secret values, lengths, hashes or tokens.
  console.warn("[staging-admin-activate] missing_or_invalid_env_names",invalidSetupNames);
  return fail("Setup not configured",503);
 }
 if(typeof digest!=="string")return fail("Setup not configured",503);
 if(Number(req.headers.get("content-length")||0)>1024)return fail("Request too large",413);
 const origin=req.headers.get("origin");
 if(!origin||origin!==new URL(req.url).origin)return fail("Invalid origin",403);
 try{
  const db=await createClient();
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user||user.id!==pinnedId||user.email?.toLowerCase()!==EMAIL||
   !user.email_confirmed_at)return fail("Not authorized",403);
  const {data:profile,error:profileError}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profileError||profile?.role!=="customer")return fail("Not eligible",403);
  const body=await req.json() as {setupToken?:unknown};
  if(typeof body.setupToken!=="string"||body.setupToken.length<32||body.setupToken.length>256)return fail("Invalid setup authorization",403);
  const provided=createHash("sha256").update(body.setupToken,"utf8").digest();
  if(!timingSafeEqual(provided,Buffer.from(digest,"hex")))return fail("Invalid setup authorization",403);
  // Only a reviewed, manually-installed, one-time Staging RPC can commit the role change.
  // It must atomically verify target UUID and email, one-admin invariant, one-time claim,
  // and the existing s8_protect_role trigger's narrowly approved mechanism.
  const {data, error:activationError}=await serverDb().rpc("activate_single_staging_admin",{
   p_user_id:user.id,p_email:EMAIL
  });
  if(activationError){
   // Server logs only: PostgREST/PostgreSQL error code and tightly allowlisted cause.
   // Do not log error.message/details/hint, user IDs, tokens, or credentials.
   const rawCode=activationError.code;
   const code=typeof rawCode==="string"&&/^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/.test(rawCode)?rawCode:"unknown";
   // PostgREST may return an error without a SQLSTATE (e.g. network/fetch failure).
   // Never emit raw messages, stack traces, headers, token, or provider response bodies.
   const message=typeof activationError.message==="string"?activationError.message:"";
   const cause=message==="Account role change denied"?"role_guard_denied":
    /fetch failed|failed to fetch|network|connection|timeout/i.test(message)?"network_or_transport":
    /permission denied|insufficient privilege/i.test(message)?"rpc_permission":
    /function .* not found|schema cache/i.test(message)?"rpc_missing_or_schema_cache":"rpc_database_error";
   const stagingServiceKey=process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY;
   console.warn("[staging-admin-activate] rpc_failed",{
    code,cause,
    serviceKeyPresent:Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    stagingServiceKeyPresent:Boolean(stagingServiceKey),
    serviceKeyMatchesStaging:Boolean(stagingServiceKey)&&process.env.SUPABASE_SERVICE_ROLE_KEY===stagingServiceKey
   });
   return fail("Activation unavailable or already used",409);
  }
  if(data!==true){
   console.warn("[staging-admin-activate] rpc_result_not_true",{
    resultType:data===false?"false":data===null?"null":typeof data
   });
   return fail("Activation unavailable or already used",409);
  }
  return NextResponse.json({activated:true,signInAt:"/login?role=admin"},{headers:{"Cache-Control":"no-store"}});
 }catch{return fail("Activation unavailable",503);}
}
