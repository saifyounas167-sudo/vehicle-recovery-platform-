import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isClientReviewDemo } from "@/src/lib/client-review";
export async function proxy(request:NextRequest){
 if(isClientReviewDemo()){
  const path=request.nextUrl.pathname, method=request.method;
  if(path.startsWith("/api/")){
   const allowedGet=method==="GET" && [
    "/api/build-info","/api/client-review-status","/api/recovery/postcode"
   ].includes(path);
   // Estimates may only resolve postcodes/ORS; the quote handler is read-only.
   const allowedEstimate=method==="POST" && [
    "/api/recovery/open-estimate","/api/recovery/estimate"
   ].includes(path);
   if(!allowedGet&&!allowedEstimate)
    return NextResponse.json({error:"Client demo only. Live marketplace operations are paused.",clientDemo:true},
     {status:503,headers:{"Cache-Control":"no-store"}});
   return NextResponse.next({request}); // Never refresh Supabase sessions.
  }
  const redirects:[string,string][]=[
   ["/admin","/demo/admin"],["/driver","/demo/driver"],
   ["/customer","/demo/customer"],["/login","/demo"],
   ["/settings","/demo"],["/notifications","/demo"]
  ];
  for(const [prefix,destination] of redirects)
   if(path===prefix||path.startsWith(prefix+"/"))
    return NextResponse.redirect(new URL(destination,request.url),{status:307});
  return NextResponse.next({request});
 }
 return updateSession(request);
}
export const config={
 matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
};
