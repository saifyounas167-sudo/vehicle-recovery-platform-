import {NextRequest,NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {getSupabaseEnv} from "@/lib/supabase/env";
import {googleOAuthEnabled,validLoginRole,roleDestination} from "@/src/lib/google-oauth-gate";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const origin=request.nextUrl.origin;
 const target=(reason:string)=>new URL("/login?reason="+encodeURIComponent(reason),origin);
 const role=validLoginRole(request.nextUrl.searchParams.get("role"));
 const code=request.nextUrl.searchParams.get("code");
 if(!googleOAuthEnabled())return NextResponse.redirect(target("google_disabled"));
 if(!role||!code||code.length>2048)return NextResponse.redirect(target("oauth_invalid"));
 const env=getSupabaseEnv();
 if(!env)return NextResponse.redirect(target("auth_unavailable"));
 const response=NextResponse.redirect(new URL(roleDestination(role),origin),{headers:{"Cache-Control":"no-store"}});
 const client=createServerClient(env.url,env.key,{cookies:{
  getAll(){return request.cookies.getAll()},
  setAll(items){for(const {name,value,options} of items){request.cookies.set(name,value);response.cookies.set(name,value,options)}}
 }});
 try{
  const exchanged=await client.auth.exchangeCodeForSession(code);
  if(exchanged.error||!exchanged.data.user)throw Error("exchange_failed");
  const {data:identity,error:identityError}=await client.auth.getUser();
  if(identityError||!identity.user||identity.user.id!==exchanged.data.user.id)throw Error("identity_failed");
  const {data:profile,error:profileError}=await client.from("profiles").select("role").eq("id",identity.user.id).maybeSingle();
  if(profileError||!profile||profile.role!==role){
   await client.auth.signOut({scope:"local"});
   response.headers.set("Location",new URL("/403",origin).toString());
   return response;
  }
  return response;
 }catch{
  await client.auth.signOut({scope:"local"}).catch(()=>{});
  response.headers.set("Location",target("oauth_failed").toString());
  return response;
 }
}
