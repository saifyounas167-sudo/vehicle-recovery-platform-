import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {serverDb} from "@/src/lib/guest-access";
import {resolvePostcode} from "@/src/lib/open-routing";
import {isRecoveryService} from "@/src/lib/recovery-service-rules";
import {isDriverRegistrationEnabled} from "@/src/lib/driver-registration-gate";
export const dynamic="force-dynamic";
const error=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
const postcode=/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;
export async function POST(req:Request){
 // This route is deliberately unavailable in current client-review Production.
 if(!isDriverRegistrationEnabled())return error("Driver registration is not active during client review",503);
 try{
  if(Number(req.headers.get("content-length")||0)>8192)return error("Request too large",413);
  const auth=await createClient();
  const {data:{user},error:authError}=await auth.auth.getUser();
  if(authError||!user)return error("Verified email sign-in required",401);
  const b=await req.json() as Record<string,unknown>;
  const name=typeof b.fullName==="string"?b.fullName.trim():"",phone=typeof b.phone==="string"?b.phone.replace(/[\s-]/g,""):"",company=typeof b.companyName==="string"?b.companyName.trim():"",truck=typeof b.truckType==="string"?b.truckType.trim():"",pc=typeof b.coveragePostcode==="string"?b.coveragePostcode.trim().toUpperCase():"";
  const radius=Number(b.coverageRadiusMiles),services=b.services,vehicles=b.vehicleCapabilities;
  const address=typeof b.businessAddress==="string"?b.businessAddress.trim():"";
  const registration=typeof b.companyRegistrationNumber==="string"?b.companyRegistrationNumber.trim():"";
  const experience=b.recoveryExperience===null||b.recoveryExperience===""?null:Number(b.recoveryExperience);
  const truckDetails=typeof b.recoveryTruckDetails==="string"?b.recoveryTruckDetails.trim():"";
  const vehicleRegistration=typeof b.vehicleRegistrationDetails==="string"?b.vehicleRegistrationDetails.trim():"";
  const operatingAreas=Array.isArray(b.operatingAreas)?b.operatingAreas:[];
  if(address.length>400||registration.length>120||truckDetails.length>1000||vehicleRegistration.length>150||(experience!==null&&(!Number.isInteger(experience)||experience<0||experience>80))||operatingAreas.length>30||!operatingAreas.every(x=>typeof x==="string"&&x.trim().length>0&&x.length<=100)||name.length<2||name.length>120||company.length>120||truck.length<2||truck.length>120||!/^(?:\+447\d{9}|07\d{9})$/.test(phone)||!postcode.test(pc)||!Number.isFinite(radius)||radius<=0||radius>300||!Array.isArray(services)||services.length===0||services.length>10||!services.every(isRecoveryService)||!Array.isArray(vehicles)||vehicles.length>5||!vehicles.every(v=>typeof v==="string"&&["Car","Van","Motorbike","4x4","Other"].includes(v)))return error("Check your driver application details",400);
  let coords;
  try{coords=await resolvePostcode(pc)}catch{return error("Coverage postcode could not be verified. Please try again.",422);}
  const db=serverDb();
  const {data:existing,error:profileError}=await db.from("profiles").select("id,role").eq("id",user.id).maybeSingle();
  if(profileError)return error("Profile service temporarily unavailable",503);
  if(existing&&existing.role!=="driver")return error("This account belongs to another role",403);
  // Check current approval before changing even the basic profile fields.
  const {data:current,error:currentError}=await db.from("driver_profiles").select("id,approval_status").eq("id",user.id).maybeSingle();
  if(currentError)return error("Unable to verify application status",503);
  if(current&&current.approval_status!=="pending"&&current.approval_status!=="rejected")return error("Approved or suspended profiles require admin-assisted updates",409);
  if(!existing){
   const {error:createError}=await db.from("profiles").insert({id:user.id,role:"driver",full_name:name,phone,email:user.email});
   if(createError)return error("Unable to create driver account",503);
  }else{
   const {error:updateError}=await db.from("profiles").update({full_name:name,phone}).eq("id",user.id).eq("role","driver");
   if(updateError)return error("Unable to update account profile",503);
  }
  const details={
   id:user.id,company_name:company||null,business_address:address||null,company_registration_number:registration||null,experience_years:experience,truck_type:truck,recovery_truck_details:truckDetails||null,vehicle_registration_details:vehicleRegistration||null,operating_areas:[...new Set(operatingAreas.map((x:string)=>x.trim()))],services:[...new Set(services)],vehicle_capabilities:[...new Set(vehicles)],
   coverage_postcode:pc,coverage_radius_miles:radius,coverage_latitude:coords.latitude,coverage_longitude:coords.longitude,
   availability:"offline",updated_at:new Date().toISOString()
  };
  // Conditional update prevents a concurrent admin approval being silently reset.
  const result=current?await db.from("driver_profiles").update({...details,approval_status:"pending"}).eq("id",user.id).eq("approval_status",current.approval_status).select("id").maybeSingle():await db.from("driver_profiles").insert({...details,approval_status:"pending"}).select("id").maybeSingle();
  if(result.error||!result.data)return error("Application state changed or could not be saved",409);
  return NextResponse.json({status:"pending",message:"Application saved for admin verification. You are not yet a verified driver."},{headers:{"Cache-Control":"no-store"}});
 }catch{return error("Unable to process application",503);}
}
