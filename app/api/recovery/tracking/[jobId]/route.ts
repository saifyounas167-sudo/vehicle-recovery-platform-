import {NextRequest,NextResponse} from "next/server";
import {getCurrentProfile} from "@/lib/auth";
import {isClientReviewDemo} from "@/src/lib/client-review";
import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
import {serverDb,validGuestProof} from "@/src/lib/guest-access";
export const dynamic="force-dynamic";
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Access={jobId?:unknown;reference?:unknown;proof?:unknown};
async function load(jobId:string,customerId?:string,reference?:string){
 const db=serverDb();
 const query=db.from("recovery_jobs").select("id,customer_id,guest_reference,status,recovery_type,pickup_postcode,destination_postcode,pickup_latitude,pickup_longitude,destination_latitude,destination_longitude,assigned_driver_id").eq("id",jobId);
 if(customerId)query.eq("customer_id",customerId);else query.is("customer_id",null).eq("guest_reference",reference!);
 const {data:job,error}=await query.maybeSingle();
 if(error)return json({error:"Tracking unavailable"},503);
 if(!job)return json({error:"Tracking not found"},404);
 if(!job.assigned_driver_id||!["assigned","in_progress","completed"].includes(job.status))return json({status:job.status,trackingAvailable:false,bookingConfirmed:false});
 const {data:offer,error:offerError}=await db.from("driver_job_offers").select("driver_id,eta_minutes,status").eq("job_id",job.id).eq("driver_id",job.assigned_driver_id).eq("status","accepted").maybeSingle();
 if(offerError)return json({error:"Tracking unavailable"},503);
 if(!offer)return json({status:job.status,trackingAvailable:false,bookingConfirmed:false});
 const {data:driver,error:driverError}=await db.from("driver_profiles").select("id,company_name,truck_type,profile_image_url,approval_status").eq("id",job.assigned_driver_id).maybeSingle();
 if(driverError||!driver)return json({error:"Driver details unavailable"},503);
 // Never treat business coverage coordinates as a truck's live position.
 const coords=(lat:unknown,lon:unknown)=>typeof lat==="number"&&typeof lon==="number"&&lat>=49&&lat<=61&&lon>=-9&&lon<=3?{latitude:lat,longitude:lon}:null;
 const {data:contact,error:contactError}=await db.from("profiles").select("phone").eq("id",driver.id).maybeSingle();
 // Fail closed: don't expose partial private driver data on profile read errors.
 if(contactError)return json({error:"Driver details unavailable"},503);
 const phone=typeof contact?.phone==="string"&&/^\+?[0-9 ()-]{7,22}$/.test(contact.phone)?contact.phone:null;
 return json({bookingConfirmed:true,status:job.status,service:job.recovery_type,reference:job.guest_reference||null,
  driver:{companyName:driver.company_name?.trim()||"Independent recovery provider",truckType:driver.truck_type||null,avatarUrl:driver.profile_image_url||null,verified:driver.approval_status==="approved",phone},
  offeredEtaMinutes:Number.isInteger(offer.eta_minutes)&&offer.eta_minutes>0?offer.eta_minutes:null,
  liveEtaMinutes:null,driverLocation:null,trackingAvailable:false,
  pickup:{postcode:job.pickup_postcode,point:coords(job.pickup_latitude,job.pickup_longitude)},
  destination:{postcode:job.destination_postcode||null,point:coords(job.destination_latitude,job.destination_longitude)}});
}
function blocked(){return isClientReviewDemo()&&!isIsolatedMarketplaceStaging()}
export async function GET(req:NextRequest,{params}:{params:Promise<{jobId:string}>}){
 if(blocked())return json({error:"Tracking is unavailable during client review"},503);
 const {jobId}=await params;
 if(!uuid.test(jobId))return json({error:"Tracking not found"},404);
 const {user,profile}=await getCurrentProfile();
 if(!user||profile?.role!=="customer")return json({error:"Not authorised"},403);
 try{return await load(jobId,user.id)}catch{return json({error:"Tracking unavailable"},503)}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{jobId:string}>}){
 if(blocked())return json({error:"Tracking is unavailable during client review"},503);
 const {jobId}=await params;
 if(!uuid.test(jobId))return json({error:"Tracking not found"},404);
 if(Number(req.headers.get("content-length")||0)>2048)return json({error:"Invalid request"},413);
 try{
  const data=await req.json() as Access;
  if(data.jobId!==jobId||typeof data.reference!=="string"||data.reference.length>200||
    typeof data.proof!=="string"||!validGuestProof(jobId,data.reference,data.proof))
    return json({error:"Not authorised"},403);
  return await load(jobId,undefined,data.reference);
 }catch{return json({error:"Tracking unavailable"},503)}
}
