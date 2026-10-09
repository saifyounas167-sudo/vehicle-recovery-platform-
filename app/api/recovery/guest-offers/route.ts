import {NextResponse} from "next/server";
import {serverDb,validGuestProof} from "@/src/lib/guest-access";
export const dynamic="force-dynamic";
export async function POST(req:Request){
 try{
  const b=await req.json();if(typeof b.jobId!=="string"||typeof b.reference!=="string"||typeof b.proof!=="string"||!validGuestProof(b.jobId,b.reference,b.proof))return NextResponse.json({error:"Not authorised"},{status:403});
  const db=serverDb();const {data:job}=await db.from("recovery_jobs").select("id,status,guest_reference,assigned_driver_id").eq("id",b.jobId).eq("guest_reference",b.reference).maybeSingle();
  if(!job)return NextResponse.json({error:"Not found"},{status:404});
  const {data:offers,error}=await db.from("driver_job_offers").select("id,offer_amount_gbp,message,status,driver_id,created_at").eq("job_id",job.id).order("created_at",{ascending:false});
  if(error)return NextResponse.json({error:"Offers unavailable"},{status:503});
  return NextResponse.json({job:{reference:job.guest_reference,status:job.status},offers:offers||[]},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Unable to load offers"},{status:400});}
}
