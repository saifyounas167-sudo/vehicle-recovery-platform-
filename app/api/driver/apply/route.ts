import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {serverDb} from "@/src/lib/guest-access";
import {resolvePostcode} from "@/src/lib/open-routing";
import {isRecoveryService} from "@/src/lib/recovery-service-rules";
import {isClientReviewDemo} from "@/src/lib/client-review";
export const dynamic="force-dynamic";
const error=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
const postcode=/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;
export async function POST(req:Request){
 // This route is deliberately unavailable in current client-review Production.
 if(isClientReviewDemo())return error("Driver registration is not active during client review",503);
 try{
  if(Number(req.headers.get("content-length")||0)>8192)return error("Request too large",413);
  const auth=await createClient();
  const {data:{user},error:authError}=await auth.auth.getUser();
  if(authError||!user||!user.email_confirmed_at)return error("Verified email sign-in required",401);
  const b=await req.json() as Record<string,unknown>;
  const name=typeof b.fullName==="string"?b.fullName.trim():"",phone=typeof b.phone==="string"?b.phone.replace(/[\s-]/g,""):"",company=typeof b.companyName==="string"?b.companyName.trim():"",truck=typeof b.truckType==="string"?b.truckType.trim():"",pc=typeof b.coveragePostcode==="string"?b.coveragePostcode.trim().toUpperCase():"";
  const radius=Number(b.coverageRadiusMiles),services=b.services,vehicles=b.vehicleCapabilities;
  if(name.length<2||name.length>120||company.length>120||truck.length<2||truck.length>120||!/^(?:\+447\d{9}|07\d{9})$/.test(phone)||!postcode.test(pc)||!Number.isFinite(radius)||radius<=0||radius>300||!Array.isArray(services)||services.length===0||services.length>10||!services.every(isRecoveryService)||!Array.isArray(vehicles)||vehicles.length===0||vehicles.length>5||!vehicles.every(v=>typeof v==="string"&&["Car","Van","Motorbike","4x4","Other"].includes(v)))return error("Check your driver application details",400);
  let coords;
  try{coords=await resolvePostcode(pc)}catch{return error("Coverage postcode could not be verified. Please try again.",422);}
  const db=serverDb();
  const {data:existing,error:profileError}=await db.from("profiles").select("id,role").eq("id",user.id).maybeSingle();
  if(profileError)return error("Profile service temporarily unavailable",503);
  if(existing&&existing.role!=="driver")return error("This account belongs to another role",403);
  if(!existing){
   const {error:createError}=await db.from("profiles").insert({id:user.id,role:"driver",full_name:name,phone,email:user.email});
   if(createError)return error("Unable to create driver account",503);
  }else{
   const {error:updateError}=await db.from("profiles").update({full_name:name,phone}).eq("id",user.id).eq("role","driver");
   if(updateError)return error("Unable to update account profile",503);
  }
  const {error:driverError}=await db.from("driver_profiles").upsert({
   id:user.id,company_name:company||null,truck_type:truck,services:[...new Set(services)],vehicle_capabilities:[...new Set(vehicles)],
   coverage_postcode:pc,coverage_radius_miles:radius,coverage_latitude:coords.latitude,coverage_longitude:coords.longitude,
   availability:"offline",approval_status:"pending",updated_at:new Date().toISOString()
  },{onConflict:"id"});
  if(driverError)return error("Unable to save driver application",503);
  return NextResponse.json({status:"pending",message:"Application saved for admin verification. You are not yet a verified driver."},{headers:{"Cache-Control":"no-store"}});
 }catch{return error("Unable to process application",503);}
}
