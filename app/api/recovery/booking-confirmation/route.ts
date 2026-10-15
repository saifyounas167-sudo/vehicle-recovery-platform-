import {NextResponse} from "next/server";
import {isClientReviewDemo} from "@/src/lib/client-review";
import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
import {serverDb,validGuestProof} from "@/src/lib/guest-access";
export const dynamic="force-dynamic";
const reply=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:Request){
 if(isClientReviewDemo()&&!isIsolatedMarketplaceStaging())return reply({error:"Bookings are unavailable during client review"},503);
 try{
  if(Number(request.headers.get("content-length")||0)>2048)return reply({error:"Invalid request"},413);
  const input=await request.json() as Record<string,unknown>;
  const jobId=input.jobId,reference=input.reference,proof=input.proof;
  if(typeof jobId!=="string"||typeof reference!=="string"||typeof proof!=="string"||!validGuestProof(jobId,reference,proof))return reply({error:"Not authorised"},403);
  const db=serverDb();
  const {data:job,error:jobError}=await db.from("recovery_jobs").select("id,status,guest_reference,assigned_driver_id,recovery_type").eq("id",jobId).eq("guest_reference",reference).maybeSingle();
  if(jobError)return reply({error:"Booking unavailable"},503);
  if(!job)return reply({error:"Booking not found"},404);
  if(!["assigned","in_progress","completed"].includes(job.status)||!job.assigned_driver_id)return reply({confirmed:false,status:"pending"});
  const {data:offer,error:offerError}=await db.from("driver_job_offers").select("id,driver_id,status,offer_amount_gbp,eta_minutes").eq("job_id",job.id).eq("driver_id",job.assigned_driver_id).eq("status","accepted").maybeSingle();
  if(offerError)return reply({error:"Booking unavailable"},503);
  if(!offer||typeof offer.offer_amount_gbp!=="number"||offer.offer_amount_gbp<=0||!Number.isInteger(offer.eta_minutes)||offer.eta_minutes<1)return reply({confirmed:false,status:"pending"});
  const {data:driver,error:driverError}=await db.from("driver_profiles").select("id,company_name,profile_image_url,approval_status").eq("id",job.assigned_driver_id).maybeSingle();
  if(driverError)return reply({error:"Booking unavailable"},503);
  if(!driver)return reply({error:"Driver unavailable"},503);
  return reply({confirmed:true,booking:{reference:job.guest_reference,status:job.status,companyName:driver.company_name?.trim()||"Independent recovery provider",companyLogoUrl:driver.profile_image_url||null,priceGbp:offer.offer_amount_gbp,etaMinutes:offer.eta_minutes,service:job.recovery_type,paymentMethod:"Pay your recovery driver directly."}});
 }catch{return reply({error:"Booking unavailable"},503);}
}
