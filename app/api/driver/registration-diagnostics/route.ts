import {NextResponse} from "next/server";
import {getCurrentProfile} from "@/lib/auth";
import {getDriverRegistrationGateDiagnostics,DRIVER_ONBOARDING_BRANCH} from "@/src/lib/driver-registration-gate";
export const dynamic="force-dynamic";
/** Preview-only: authenticated existing Staging Driver or Admin may inspect boolean-only gate checks. No credentials, URL values or provider response bodies. */
export async function GET(){
 if(process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!==DRIVER_ONBOARDING_BRANCH)
  return NextResponse.json({error:"Not found"},{status:404,headers:{"Cache-Control":"no-store"}});
 try {
  const {user,profile}=await getCurrentProfile();
  if(!user||!profile||!["admin","driver"].includes(profile.role))
   return NextResponse.json({error:"Staging Driver or Admin login required"},{status:403,headers:{"Cache-Control":"no-store"}});
  const diagnostic=await getDriverRegistrationGateDiagnostics();
  return NextResponse.json(diagnostic,{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"Staging login or configuration unavailable"},{status:403,headers:{"Cache-Control":"no-store"}});
 }
}
