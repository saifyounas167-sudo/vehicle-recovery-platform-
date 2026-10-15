import {NextResponse} from "next/server";
import {serverDb,validGuestProof} from "@/src/lib/guest-access";
export const dynamic="force-dynamic";
const response=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"no-store"}});
type Input={jobId?:unknown;reference?:unknown;proof?:unknown};
export async function POST(req:Request){
 try{
  if(Number(req.headers.get("content-length")||0)>2048)return response({error:"Invalid request"},413);
  const body=await req.json() as Input;
  if(typeof body.jobId!=="string"||typeof body.reference!=="string"||typeof body.proof!=="string"||!validGuestProof(body.jobId,body.reference,body.proof))return response({error:"Not authorised"},403);
  const db=serverDb();
  const {data:job,error:jobError}=await db.from("recovery_jobs").select("id,status,guest_reference,assigned_driver_id").eq("id",body.jobId).eq("guest_reference",body.reference).maybeSingle();
  if(jobError)return response({error:"Offers temporarily unavailable"},503);
  if(!job)return response({error:"Not found"},404);
  const {data:rows,error}=await db.from("driver_job_offers").select("id,driver_id,offer_amount_gbp,eta_minutes,message,status,created_at").eq("job_id",job.id).in("status",["pending","accepted"]).order("created_at",{ascending:false}).limit(100);
  if(error)return response({error:"Offers temporarily unavailable"},503);
  const driverIds=[...new Set((rows||[]).map(row=>row.driver_id).filter(Boolean))];
  const {data:drivers,error:driverError}=driverIds.length?await db.from("driver_profiles").select("id,company_name,truck_type,services,coverage_radius_miles,profile_image_url,approval_status").in("id",driverIds):{data:[],error:null};
  if(driverError)return response({error:"Driver information unavailable"},503);
  const byId=new Map((drivers||[]).map(d=>[d.id,d]));
  const offers=(rows||[]).flatMap(row=>{
   const driver=byId.get(row.driver_id);
   if(!driver||typeof row.offer_amount_gbp!=="number"||!Number.isFinite(row.offer_amount_gbp)||row.offer_amount_gbp<=0||!Number.isInteger(row.eta_minutes)||row.eta_minutes<1)return [];
   return [{
    id:row.id,
    priceGbp:row.offer_amount_gbp,
    etaMinutes:row.eta_minutes,
    message:typeof row.message==="string"?row.message.slice(0,500):"",
    status:row.status,
    driver:{name:driver.company_name?.trim()||"Independent recovery provider",verified:driver.approval_status==="approved",imageUrl:driver.profile_image_url||null,truckType:driver.truck_type||null,services:driver.services||[],coverageRadiusMiles:driver.coverage_radius_miles??null,rating:null,reviewCount:0}
   }];
  });
  return response({job:{reference:job.guest_reference,status:job.status},offers});
 }catch{return response({error:"Offers temporarily unavailable"},503);}
}
