import {NextResponse} from "next/server";
import {serverDb,validGuestProof} from "@/src/lib/guest-access";
export async function POST(req:Request){
 try{
  const b=await req.json();if(typeof b.jobId!=="string"||typeof b.reference!=="string"||typeof b.proof!=="string"||typeof b.offerId!=="string"||!validGuestProof(b.jobId,b.reference,b.proof))return NextResponse.json({error:"Not authorised"},{status:403});
  const db=serverDb();const {data:job}=await db.from("recovery_jobs").select("id").eq("id",b.jobId).eq("guest_reference",b.reference).maybeSingle();
  if(!job)return NextResponse.json({error:"Not found"},{status:404});
  const {data,error}=await db.rpc("accept_guest_recovery_offer",{p_job_id:job.id,p_offer_id:b.offerId});
  if(error)return NextResponse.json({error:"Unable to accept offer"},{status:503});
  if(!data)return NextResponse.json({error:"Offer no longer available"},{status:409});
  return NextResponse.json({accepted:true},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Unable to process offer"},{status:400});}
}
