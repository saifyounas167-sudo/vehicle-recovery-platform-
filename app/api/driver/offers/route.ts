import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(req:Request){
 try{
  if(Number(req.headers.get("content-length")||0)>4096)return NextResponse.json({error:"Request too large"},{status:413});
  const b=await req.json();
  if(typeof b.jobId!=="string"||!/^[0-9a-f-]{36}$/i.test(b.jobId)||typeof b.amount!=="number"||!Number.isFinite(b.amount)||b.amount<1||b.amount>100000||typeof b.etaMinutes!=="number"||!Number.isInteger(b.etaMinutes)||b.etaMinutes<1||b.etaMinutes>1440||typeof b.message!=="string"||b.message.length>500)return NextResponse.json({error:"Invalid price, ETA or job"},{status:400});
  const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required"},{status:401});
  const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="driver")return NextResponse.json({error:"Driver role required"},{status:403});
  const {data:driver}=await db.from("driver_profiles").select("approval_status").eq("id",user.id).maybeSingle();
  if(driver?.approval_status!=="approved")return NextResponse.json({error:"Driver approval required"},{status:403});
  // Membership entitlements are not implemented yet. Fail closed rather than accepting unpaid/unverified drivers.
  return NextResponse.json({error:"Driver membership verification is not configured; offers are temporarily disabled"},{status:503});
  /* const {data:job}=await db.from("recovery_jobs").select("id,status,assigned_driver_id").eq("id",b.jobId).maybeSingle();
  if(!job||job.assigned_driver_id||!["submitted","matching","offered"].includes(job.status))return NextResponse.json({error:"Job is not accepting offers"},{status:409});
  const {data,error}=await db.from("driver_job_offers").insert({job_id:job.id,driver_id:user.id,offer_amount_gbp:b.amount,eta_minutes:b.etaMinutes,message:b.message.trim(),status:"pending"}).select("id").single();
  if(error){if(error.code==="23505")return NextResponse.json({error:"You already submitted an offer"},{status:409});return NextResponse.json({error:"Offer unavailable; check your membership and eligibility"},{status:403});}
  return NextResponse.json({offerId:data.id},{status:201}); */
 }catch{return NextResponse.json({error:"Unable to submit offer"},{status:400});}
}
