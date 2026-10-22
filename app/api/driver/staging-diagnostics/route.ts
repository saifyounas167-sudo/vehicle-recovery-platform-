import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getDriverRegistrationGateDiagnostics,DRIVER_ONBOARDING_BRANCH} from "@/src/lib/driver-registration-gate";
export const dynamic="force-dynamic";
export async function GET(){
 const fail=(status:number)=>NextResponse.json({error:"Unavailable"},{status,headers:{"Cache-Control":"no-store"}});
 if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!==DRIVER_ONBOARDING_BRANCH)return fail(404);
 try{
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user)return fail(401);
  const {data:profile,error}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(error||profile?.role!=="admin")return fail(403);
  const diagnostics=await getDriverRegistrationGateDiagnostics();
  return NextResponse.json(diagnostics,{headers:{"Cache-Control":"no-store"}});
 }catch{return fail(503);}
}
