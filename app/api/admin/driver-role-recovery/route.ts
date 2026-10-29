import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {serverDb} from "@/src/lib/guest-access";
import {isDriverRegistrationEnabled} from "@/src/lib/driver-registration-gate";
export const dynamic="force-dynamic";
const reply=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
/** Explicit Admin-reviewed recovery for the single confirmed legacy Staging applicant.
 * Never callable in Production and never grants approval or marketplace access.
 * Requires the reviewed SQL migration before use.
 */
export async function POST(req:Request){
 if(process.env.VERCEL_ENV!=="preview"||
    process.env.VERCEL_GIT_COMMIT_REF!=="integration/staging-recovery-pr56-pr55-pr70"||
    process.env.NEXT_PUBLIC_SUPABASE_URL!=="https://ozphvosiqbzvkthlppkd.supabase.co"||
    !(await isDriverRegistrationEnabled()))return reply("Unavailable",404);
 const origin=req.headers.get("origin");
 if(!origin||origin!==new URL(req.url).origin)return reply("Invalid origin",403);
 if(Number(req.headers.get("content-length")||0)>1024)return reply("Request too large",413);
 try{
  const auth=await createClient();
  const {data:{user},error:userError}=await auth.auth.getUser();
  if(userError||!user||!user.email_confirmed_at)return reply("Admin authentication required",403);
  const {data:profile,error:profileError}=await auth.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profileError||profile?.role!=="admin")return reply("Admin authentication required",403);
  const body=await req.json() as {userId?:unknown;reviewConfirmed?:unknown};
  if(body.reviewConfirmed!==true||typeof body.userId!=="string"||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(body.userId))
   return reply("Explicit Admin review and a valid user ID are required",400);
  const db=serverDb();
  const {data:target,error:lookupError}=await db.auth.admin.getUserById(body.userId);
  if(lookupError||!target.user||target.user.email?.toLowerCase()!=="mirpurdigitalmarketing@gmail.com"||
     !target.user.email_confirmed_at||target.user.user_metadata?.registration_flow!=="driver_application_v1")
    return reply("Not eligible for verified Driver signup recovery",409);
  const {data,error}=await db.rpc("ss8_recover_verified_driver_signup",{p_user_id:body.userId});
  if(error||data!==true)return reply("Recovery not available; check Staging migration and eligibility",409);
  return NextResponse.json({recovered:true,role:"driver",approval:"not_submitted"},{headers:{"Cache-Control":"no-store"}});
 }catch{return reply("Recovery unavailable",503);}
}
