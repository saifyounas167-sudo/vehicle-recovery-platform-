import {NextRequest,NextResponse} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {getSupabaseEnv} from "@/lib/supabase/env";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const origin=request.nextUrl.origin;
 const kind=request.nextUrl.searchParams.get("type");
 const reason=(message:string)=>NextResponse.redirect(new URL("/login?role=customer&reason="+message,origin));
 if(kind!=="signup"&&kind!=="recovery")return reason("invalid_link");
 const env=getSupabaseEnv();if(!env)return reason("auth_unavailable");
 const dest=kind==="recovery"?"/login?role=customer&mode=recovery":"/login?role=customer&reason=verified";
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
  if(kind==="signup"){
   const {data:profile,error:profileError}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
   if(profileError||profile?.role!=="customer"){await supabase.auth.signOut({scope:"local"});return reason("access_pending")}
   response.headers.set("Location",new URL("/customer",origin).toString());
  }
  return response;
 }catch{await supabase.auth.signOut({scope:"local"}).catch(()=>{});return reason("expired_link")}
}
