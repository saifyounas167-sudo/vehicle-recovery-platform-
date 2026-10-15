import {isClientReviewDemo} from "@/src/lib/client-review";
import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
import {NextResponse} from "next/server";
import {serverDb,validGuestProof} from "@/src/lib/guest-access";
export async function POST(req:Request){
 if(isClientReviewDemo()&&!isIsolatedMarketplaceStaging())return NextResponse.json({error:"Client review is read-only. Live marketplace operations are paused."},{status:503,headers:{"Cache-Control":"no-store"}});
 try{
  const b=await req.json();if(typeof b.jobId!=="string"||typeof b.reference!=="string"||typeof b.proof!=="string"||typeof b.offerId!=="string"||!validGuestProof(b.jobId,b.reference,b.proof))return NextResponse.json({error:"Not authorised"},{status:403});
  const db=serverDb();const {data:job}=await db.from("recovery_jobs").select("id").eq("id",b.jobId).eq("guest_reference",b.reference).maybeSingle();
  if(!job)return NextResponse.json({error:"Not found"},{status:404});
  // This approval/eligibility check fails closed until migration 0013 functions,
  // RLS and atomic acceptance are independently verified in authorised staging.
  const {data:offer,error:offerError}=await db.from("driver_job_offers")
   .select("driver_id,status").eq("id",b.offerId).eq("job_id",job.id).eq("status","pending").maybeSingle();
  if(offerError)return NextResponse.json({error:"Offer verification unavailable"},{status:503});
  if(!offer)return NextResponse.json({error:"Offer no longer available"},{status:409});
  const {data:eligible,error:eligibleError}=await db.rpc("eligible_driver_for_job",{p_driver_id:offer.driver_id,p_job_id:job.id});
  if(eligibleError)return NextResponse.json({error:"Driver eligibility verification unavailable"},{status:503});
  if(eligible!==true)return NextResponse.json({error:"Driver is not currently eligible"},{status:409});
  const {data,error}=await db.rpc("accept_guest_recovery_offer",{p_job_id:job.id,p_offer_id:b.offerId});
  if(error)return NextResponse.json({error:"Unable to accept offer"},{status:503});
  if(!data)return NextResponse.json({error:"Offer no longer available"},{status:409});
  return NextResponse.json({accepted:true},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Unable to process offer"},{status:400});}
}
