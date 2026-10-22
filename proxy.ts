import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
import {isDriverRegistrationEnabled} from "@/src/lib/driver-registration-gate";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isClientReviewDemo } from "@/src/lib/client-review";
export async function proxy(request:NextRequest){
 // Public homepage never requires server-side Supabase auth. Keep protected
 // dashboard routes on updateSession; this avoids a failing Preview Auth
 // dependency from preventing the public site from loading.
 // OPTIONS is a safe capability probe on the PUBLIC root, not a write.
 // Never grant OPTIONS bypasses to APIs or authenticated dashboard routes.
 if(request.nextUrl.pathname==="/"&&request.method==="OPTIONS")
  return new NextResponse(null,{status:204,headers:{"Allow":"GET, HEAD, OPTIONS","Cache-Control":"no-store"}});
 if(request.nextUrl.pathname==="/"&&(request.method==="GET"||request.method==="HEAD"))
  return NextResponse.next({request});
 if(isClientReviewDemo()&&!isIsolatedMarketplaceStaging()){
  const path=request.nextUrl.pathname, method=request.method;
  // Prevent Next.js Server Actions and any page-origin POST/PUT/PATCH/DELETE.
  if(!path.startsWith("/api/") && method!=="GET" && method!=="HEAD")
   return NextResponse.json({error:"Client demo read-only.",clientDemo:true},{status:503});
  if(path.startsWith("/api/")){
   const allowedGet=method==="GET" && [
    "/api/build-info","/api/client-review-status","/api/auth/google-status","/api/driver/registration-status","/api/driver/registration-diagnostics","/api/recovery/postcode",
    "/api/recovery/location-suggest",
    "/api/driver/registration-status"
   ].includes(path);
   // Estimates may only resolve postcodes/ORS; the quote handler is read-only.
   const allowedEstimate=method==="POST" && [
    "/api/recovery/open-estimate","/api/recovery/estimate"
   ].includes(path);
   // Admin-authenticated diagnostics are read-only and restricted to PR56 Preview.
   if(method==="GET"&&path==="/api/driver/staging-diagnostics"&&
      process.env.VERCEL_ENV==="preview"&&
      process.env.VERCEL_GIT_COMMIT_REF==="feature/ss8-driver-approval-inbox-secure")
    return NextResponse.next({request});
   // Single-use Admin setup is limited to the exact Staging Preview and remains
   // additionally guarded in its route by Auth, verified UUID and setup token.
   if(method==="POST"&&path==="/api/staging/admin-activate"&&
      process.env.VERCEL_ENV==="preview"&&
      process.env.VERCEL_GIT_COMMIT_REF==="feature/ss8-driver-approval-inbox-secure"&&
      process.env.STAGING_ADMIN_ACTIVATION_ENABLED==="enabled"&&
      process.env.NEXT_PUBLIC_SUPABASE_URL==="https://ozphvosiqbzvkthlppkd.supabase.co"&&
      process.env.STAGING_SUPABASE_URL==="https://ozphvosiqbzvkthlppkd.supabase.co")
    return updateSession(request);
   // PR #56: isolated driver onboarding only; no general marketplace writes.
   const onboardingGet=method==="GET"&&[
    "/api/driver/registration-status","/api/driver/documents",
    "/api/admin/drivers","/api/admin/drivers/document-access"
   ].includes(path);
   const onboardingWrite=method==="POST"&&[
    "/api/driver/apply","/api/driver/documents","/api/admin/drivers"
   ].includes(path);
   if((onboardingGet||onboardingWrite)&&await isDriverRegistrationEnabled())
    return updateSession(request);
   if(!allowedGet&&!allowedEstimate)
    return NextResponse.json({error:"Client demo only. Live marketplace operations are paused.",clientDemo:true},
     {status:503,headers:{"Cache-Control":"no-store"}});
   return NextResponse.next({request}); // Marketplace APIs stay read-only.
  }
  // Permit only safe page GETs; role checks remain in server components.
  // Session refresh may set auth cookies, but cannot enable marketplace writes.
  return updateSession(request);
 }
 return updateSession(request);
}
export const config={
 matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
};
