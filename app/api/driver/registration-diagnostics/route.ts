import {NextResponse} from "next/server";
import {requireRole} from "@/lib/auth";
import {getDriverRegistrationGateDiagnostics,isDriverOnboardingPreviewBranch} from "@/src/lib/driver-registration-gate";
export const dynamic="force-dynamic";
/** Admin-only. Never return environment values, keys, provider response bodies or URLs. */
export async function GET(){
 if(process.env.VERCEL_ENV!=="preview"||!isDriverOnboardingPreviewBranch())
  return NextResponse.json({error:"Not found"},{status:404,headers:{"Cache-Control":"no-store"}});
 try {
  await requireRole("admin");
  const diagnostic=await getDriverRegistrationGateDiagnostics();
  return NextResponse.json(diagnostic,{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"Admin authorization required"},{status:403,headers:{"Cache-Control":"no-store"}});
 }
}
