import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

const services = new Set(["Breakdown Recovery","Accident Recovery","Vehicle Transport","Car Towing","Jump Start / Flat Battery Assistance","Flat Tyre Assistance","Motorbike Recovery","Van Recovery","Auction Vehicle Collection","Non-Running Vehicle Transport"]);
const postcode=/^(GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}))$/i;
const mobile=/^(?:\+447\d{9}|07\d{9})$/;
const text=(v:unknown,max=250)=>typeof v==="string"?v.trim().slice(0,max):"";
const bad=(error:string,status=400)=>NextResponse.json({error},{status});
export async function POST(request:Request){
 try{
  const type=request.headers.get("content-type")||"";
  if(!type.includes("application/json"))return bad("JSON required",415);
  const length=Number(request.headers.get("content-length")||0);
  if(length>20000)return bad("Request too large",413);
  const b=await request.json();
  if(!b||typeof b!=="object"||Array.isArray(b))return bad("Invalid request");
  if(text(b.website))return bad("Request rejected");
  const pickup=text(b.pickupPostcode,12).toUpperCase(),mode=text(b.destinationMode,60),destination=text(b.destinationPostcode,12).toUpperCase();
  const name=text(b.customerName,120),email=text(b.email,254).toLowerCase(),phone=text(b.phone,30).replace(/[\s-]/g,"");
  const service=text(b.recoveryType,100);
  if(!postcode.test(pickup)||!(["transport","Nearest Garage","Roadside Assistance Without Transport"].includes(mode)))return bad("Invalid pickup or destination option");
  if(mode==="transport"&&!postcode.test(destination))return bad("Invalid destination postcode");
  if(!services.has(service))return bad("Invalid recovery service");
  if(!text(b.make,100)||!text(b.model,100)||!["Car","Van","Motorbike","4x4","Other"].includes(b.vehicleType)||!["Automatic","Manual"].includes(b.transmission)||!["Running","Non-running"].includes(b.runningStatus)||!["Yes","No"].includes(b.accident))return bad("Invalid vehicle information");
  if(b.runningStatus==="Non-running"&&(!["Yes","No","Not sure"].includes(b.rollingStatus)||!["Yes","No","Not sure"].includes(b.lockedWheels)||!["Yes","No","Not sure"].includes(b.damagedWheels)))return bad("Vehicle condition details required");
  if(!text(b.problemDescription,3000)||!["urgent","Scheduled"].includes(b.timing))return bad("Recovery details required");
  if(b.timing==="Scheduled"&&(!b.preferredCollectionTime||!Number.isFinite(Date.parse(b.preferredCollectionTime))||Date.parse(b.preferredCollectionTime)<Date.now()))return bad("Valid future collection time required");
  if(!name||!mobile.test(phone)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!["Phone","SMS","Email"].includes(b.contactPreference))return bad("Valid contact details required");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return bad("Guest requests are temporarily unavailable",503);
  const admin=createAdminClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  let userId:string|null=null;
  try{const client=await createClient();const {data:{user}}=await client.auth.getUser();if(user){const {data:profile}=await client.from("profiles").select("role").eq("id",user.id).maybeSingle();if(profile?.role!=="customer")return bad("Customer role required",403);userId=user.id;}}catch{return bad("Authentication service unavailable",503);}
  const secret=process.env.GUEST_REQUEST_HASH_SECRET;
  if(!secret||secret.length<32)return bad("Guest request protection is not configured",503);
  const fingerprint=createHash("sha256").update(secret+"|"+email+"|"+phone+"|"+pickup+"|"+service+"|"+text(b.registration,20)+"|"+Math.floor(Date.now()/300000)).digest("hex");
  const reference="UKR-"+randomBytes(7).toString("hex").toUpperCase();
  const row={customer_id:userId,guest_reference:reference,request_fingerprint:fingerprint,recovery_type:service,pickup_postcode:pickup,destination_postcode:mode==="transport"?destination:null,nearest_garage_requested:mode==="Nearest Garage",roadside_assistance_requested:mode==="Roadside Assistance Without Transport",vehicle_registration:text(b.registration,20)||null,vehicle_make:text(b.make,100),vehicle_model:text(b.model,100),vehicle_type:b.vehicleType,transmission:b.transmission,running_status:b.runningStatus,rolling_status:b.runningStatus==="Non-running"?b.rollingStatus:null,wheel_condition:b.runningStatus==="Non-running"?"Locked: "+b.lockedWheels+"; damaged: "+b.damagedWheels:null,accident_status:b.accident,problem_description:text(b.problemDescription,3000),is_urgent:b.timing==="urgent",preferred_collection_time:b.timing==="Scheduled"?new Date(b.preferredCollectionTime).toISOString():null,customer_contact_preference:b.contactPreference,status:"submitted" as const};
  const {data:job,error:insertError}=await admin.from("recovery_jobs").insert(row).select("id,status,guest_reference").single();
  if(insertError){if(insertError.code==="23505")return bad("A similar request was submitted recently. Please wait before trying again.",429);console.error("Recovery job insert failed",insertError.code);return bad("Could not create recovery request",503);}
  const {error:contactError}=await admin.from("recovery_job_private_contacts").insert({job_id:job.id,full_name:name,phone,email});
  if(contactError){await admin.from("recovery_jobs").delete().eq("id",job.id);console.error("Private contact save failed",contactError.code);return bad("Could not securely save contact details",503);}
  const photoToken=createHmac("sha256",secret).update("photo|"+job.id+"|"+job.guest_reference).digest("hex");
  return NextResponse.json({photoUpload:{jobId:job.id,reference:job.guest_reference,token:photoToken},job:{id:job.guest_reference,status:job.status}},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Recovery request failed",e);return bad("Unable to process recovery request",400);}
}
