import {NextRequest,NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {getSupabaseEnv} from "@/lib/supabase/env";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const origin=request.nextUrl.origin;
 const kind=request.nextUrl.searchParams.get("type");
 const requestedRole=request.nextUrl.searchParams.get("role");
 const role=requestedRole==="driver"?"driver":"customer";
 const reason=(message:string)=>NextResponse.redirect(new URL("/login?role="+role+"&reason="+encodeURIComponent(message),origin));
 if(request.nextUrl.searchParams.has("error"))return reason("expired_link");
 if(kind!=="signup"&&kind!=="recovery")return reason("invalid_link");
 const env=getSupabaseEnv();if(!env)return reason("auth_unavailable");
 const dest=kind==="recovery"?"/login?role="+role+"&mode=recovery":role==="driver"?"/driver/register":"/login?role=customer&reason=verified";
 const response=NextResponse.redirect(new URL(dest,origin),{headers:{"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
 const supabase=createServerClient(env.url,env.key,{cookies:{
  getAll(){return request.cookies.getAll()},
  setAll(items){for(const {name,value,options} of items){request.cookies.set(name,value);response.cookies.set(name,value,options)}}
 }});
 const code=request.nextUrl.searchParams.get("code");
 const token=request.nextUrl.searchParams.get("token_hash");
 try{
  if(code){const {error}=await supabase.auth.exchangeCodeForSession(code);if(error)throw error}
  else if(token){const {error}=await supabase.auth.verifyOtp({token_hash:token,type:kind==="recovery"?"recovery":"email"});if(error)throw error}
  else return reason("invalid_link");
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user)throw Error("Unauthenticated");
  if(kind==="signup"||kind==="recovery"){
   const {data:profile,error:profileError}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
   // Driver profile is created only after the verified driver submits /api/driver/apply.
   // Reject an existing non-driver role; do not require an application before signup is complete.
   const acceptable=kind==="signup"&&role==="driver"
    ?(!profile||profile.role==="driver")
    :profile?.role===(kind==="signup"?"customer":role);
   if(profileError||!acceptable){await supabase.auth.signOut({scope:"local"});return reason("access_pending")}
   if(kind==="signup")response.headers.set("Location",new URL(role==="driver"?"/driver/register":"/customer",origin).toString());
  }
  return response;
 }catch{await supabase.auth.signOut({scope:"local"}).catch(()=>{});return reason("expired_link")}
}
