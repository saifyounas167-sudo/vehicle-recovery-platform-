import {NextResponse} from "next/server";
import {isDriverRegistrationEnabled} from "@/src/lib/driver-registration-gate";
export const dynamic="force-dynamic";
const PREVIEW_BRANCH="integration/staging-recovery-pr56-pr55-pr70";
const STAGING_URL="https://ozphvosiqbzvkthlppkd.supabase.co";
export async function GET(){
 const registrationEnabled=await isDriverRegistrationEnabled();
 const designPreviewEnabled=process.env.VERCEL_ENV==="preview"&&
  process.env.VERCEL_GIT_COMMIT_REF===PREVIEW_BRANCH&&
  process.env.NEXT_PUBLIC_SUPABASE_URL===STAGING_URL;
 return NextResponse.json({registrationEnabled,designPreviewEnabled},
  {headers:{"Cache-Control":"no-store"}});
}
