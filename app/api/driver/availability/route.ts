import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {isClientReviewDemo} from "@/src/lib/client-review";
import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
export const dynamic="force-dynamic";
export async function POST(req:Request){
 const reply=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
 if(isClientReviewDemo()&&!isIsolatedMarketplaceStaging())return reply("Driver status updates are paused",503);
 try{
  const {availability}=await req.json();
  if(!["available","busy","offline"].includes(availability))return reply("Invalid availability status",400);
  const db=await createClient(),{data:{user}}=await db.auth.getUser();
  if(!user)return reply("Sign in required",401);
  const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="driver")return reply("Driver role required",403);
  const {data:driver}=await db.from("driver_profiles").select("approval_status").eq("id",user.id).maybeSingle();
  if(driver?.approval_status!=="approved"&&availability!=="offline")return reply("Admin approval required",403);
  const {error}=await db.from("driver_profiles").update({availability}).eq("id",user.id);
  if(error)return reply("Unable to change driver status",503);
  return NextResponse.json({availability},{headers:{"Cache-Control":"no-store"}});
 }catch{return reply("Unable to update availability",503);}
}
