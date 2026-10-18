import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {serverDb} from "@/src/lib/guest-access";
import {isDriverRegistrationEnabled} from "@/src/lib/driver-registration-gate";
export const dynamic="force-dynamic";
const send=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
async function admin(){
 const auth=await createClient(),{data:{user}}=await auth.auth.getUser();
 if(!user)return null;
 const db=serverDb(),{data:profile,error}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(error||profile?.role!=="admin")return null;
 return {db,user};
}
export async function GET(){
 if(!isDriverRegistrationEnabled())return send({error:"Admin actions are paused for client review"},503);
 try{
  const access=await admin();if(!access)return send({error:"Admin authentication required"},403);
  const {data,error}=await access.db.from("driver_profiles").select("id,company_name,business_address,company_registration_number,experience_years,truck_type,recovery_truck_details,vehicle_registration_details,operating_areas,services,coverage_postcode,coverage_radius_miles,approval_status,created_at").order("created_at",{ascending:false}).limit(100);
  if(error)return send({error:"Driver records unavailable"},503);
  const ids=(data||[]).map(x=>x.id);
  const {data:people,error:peopleError}=ids.length?await access.db.from("profiles").select("id,full_name,email,phone").in("id",ids):{data:[],error:null};
  if(peopleError)return send({error:"Driver account details unavailable"},503);
  const {data:docs,error:docError}=ids.length?await access.db.from("driver_verification_documents").select("id,driver_id,document_type").in("driver_id",ids):{data:[],error:null};
  if(docError)return send({error:"Verification documents unavailable"},503);
  // No public URLs. Only metadata so reviewers can verify document presence.
  return send({drivers:(data||[]).map(d=>({...d,account:(people||[]).find(p=>p.id===d.id)||null,documents:(docs||[]).filter(x=>x.driver_id===d.id).map(x=>({id:x.id,type:x.document_type}))}))});
 }catch{return send({error:"Driver review unavailable"},503);}
}
export async function POST(req:Request){
 if(!isDriverRegistrationEnabled())return send({error:"Admin actions are paused for client review"},503);
 try{
  const access=await admin();if(!access)return send({error:"Admin authentication required"},403);
  if(Number(req.headers.get("content-length")||0)>4096)return send({error:"Request too large"},413);
  const origin=req.headers.get("origin");
  if(origin&&origin!==new URL(req.url).origin)return send({error:"Invalid request origin"},403);
  const b=await req.json() as Record<string,unknown>,driverId=b.driverId,status=b.status;
  if(typeof driverId!=="string"||!/^[a-f\d-]{36}$/i.test(driverId)||!["approved","rejected","suspended"].includes(String(status))||driverId===access.user.id)return send({error:"Invalid approval request"},400);
  const {data:driver,error:driverError}=await access.db.from("driver_profiles").select("id,company_name,approval_status,services,truck_type,coverage_postcode,coverage_latitude,coverage_longitude,vehicle_capabilities").eq("id",driverId).maybeSingle();
  if(driverError||!driver)return send({error:"Driver not found"},404);
  if(status==="approved"&&!["pending","rejected"].includes(driver.approval_status))return send({error:"Only pending or rejected applications may be approved"},409);
  if(status==="approved"&&b.reviewConfirmed!==true)return send({error:"Admin must confirm document review before approval"},409);
  if(status==="approved"){
   const {data:docs,error:docsError}=await access.db.from("driver_verification_documents").select("document_type").eq("driver_id",driverId);
   if(docsError)return send({error:"Documents unavailable"},503);
   const required=["insurance","valid_id"];
   if(!required.every(kind=>docs?.some(d=>d.document_type===kind)))return send({error:"Insurance and valid ID verification are required before approval"},409);
   if(!driver.services?.length||!driver.truck_type||!driver.coverage_postcode||driver.coverage_latitude==null||driver.coverage_longitude==null)return send({error:"Driver capability and verified coverage details incomplete"},409);
  }
  const {data:changed,error:changeError}=await access.db.from("driver_profiles").update({approval_status:status,availability:"offline",updated_at:new Date().toISOString()}).eq("id",driverId).eq("approval_status",driver.approval_status).select("id").maybeSingle();
  if(changeError||!changed)return send({error:"Approval status changed. Refresh before deciding again."},409);
  return send({updated:true,status});
 }catch{return send({error:"Unable to complete review"},503);}
}
