import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(req:Request){
 try{
  const input=await req.json();
  if(typeof input.jobId!=="string"||!/^[0-9a-f-]{36}$/i.test(input.jobId)||!Number.isFinite(input.price)||input.price<=0||input.price>100000||!Number.isInteger(input.etaMinutes)||input.etaMinutes<1||input.etaMinutes>1440||typeof input.message!=="string"||input.message.length>500)return NextResponse.json({error:"Invalid offer"},{status:400});
  const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:"Login required"},{status:401});
  const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();if(profile?.role!=="driver")return NextResponse.json({error:"Driver role required"},{status:403});
  const {data:driver}=await db.from("driver_profiles").select("approval_status").eq("id",user.id).maybeSingle();
  const {data:membership}=await db.from("driver_memberships").select("status,valid_until").eq("driver_id",user.id).maybeSingle();
  if(driver?.approval_status!=="approved"||membership?.status!=="active"||!membership.valid_until||new Date(membership.valid_until)<=new Date())return NextResponse.json({error:"Verified driver and active membership required"},{status:403});
  const {data,error}=await db.from("driver_job_offers").insert({job_id:input.jobId,driver_id:user.id,offer_amount_gbp:input.price,eta_minutes:input.etaMinutes,message:input.message.trim(),status:"pending"}).select("id").single();
  if(error)return NextResponse.json({error:error.code==="23505"?"Offer already submitted":"Job unavailable or offer not permitted"},{status:error.code==="23505"?409:403});
  return NextResponse.json({offerId:data.id},{status:201});
 }catch{return NextResponse.json({error:"Offer could not be processed"},{status:400});}
}
