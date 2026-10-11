import {type NextRequest,NextResponse} from "next/server";
const pages=new Set(["/","/how-it-works","/about"]);
const safeApi=new Set(["/api/recovery/postcode","/api/recovery/location-suggest"]);
export function proxy(request:NextRequest){
 const path=request.nextUrl.pathname;
 const method=request.method.toUpperCase();
 const headers={"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow, noarchive"};
 if(method!=="GET"&&method!=="HEAD")return NextResponse.json({error:"Client preview is read-only"},{status:403,headers});
 if(path.startsWith("/api/")){
  if(method==="GET"&&safeApi.has(path))return NextResponse.next({headers});
  return NextResponse.json({error:"Not available in client preview"},{status:404,headers});
 }
 if(pages.has(path)||pages.has(path.replace(/\/$/,"")))return NextResponse.next({headers});
 return new NextResponse("Not found in client preview",{status:404,headers:{"Content-Type":"text/plain; charset=utf-8",...headers}});
}
// Next's internal static delivery is excluded; all app paths, including API and RSC, pass this guard.
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif|woff2?|css|js|webmanifest)$).*)"]};
