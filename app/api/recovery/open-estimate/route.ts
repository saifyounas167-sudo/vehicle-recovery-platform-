import {NextResponse} from "next/server";
import {createClient as createAdminClient} from "@supabase/supabase-js";
import {resolvePostcode,previewDrivingRoute} from "@/src/lib/open-routing";
import {calculateRecoveryPrice,validPricingConfig,ukHoliday} from "@/src/lib/recovery-pricing";
export const dynamic="force-dynamic";
const pc=/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;
const unavailable=(route?:unknown)=>NextResponse.json({available:false,message:"Price to be confirmed by recovery drivers",...(route?{route}:{})},{headers:{"Cache-Control":"no-store"}});
export async function POST(request:Request){
 try{
  if(Number(request.headers.get("content-length")||0)>4096)return NextResponse.json({error:"Request too large"},{status:413});
  const b=await request.json(),pickup=String(b.pickupPostcode||"").trim(),destination=String(b.destinationPostcode||"").trim();
  if(!pc.test(pickup)||!pc.test(destination))return NextResponse.json({error:"Valid UK pickup and destination postcodes required"},{status:400});
  const [origin,end]=await Promise.all([resolvePostcode(pickup),resolvePostcode(destination)]);
  const route=await previewDrivingRoute(origin,end);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return unavailable(route);
  const db=createAdminClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:rules,error}=await db.from("pricing_rules").select("rule_config").eq("active",true).limit(2);
  if(error||!rules||rules.length!==1||!validPricingConfig(rules[0].rule_config))return unavailable(route);
  const now=new Date(),local=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23",weekday:"short"}).formatToParts(now);
  const part=(type:string)=>local.find(p=>p.type===type)?.value||"";
  const localDate=part("year")+"-"+part("month")+"-"+part("day");
  const scheduled=typeof b.scheduledAt==="string"&&b.scheduledAt?new Date(b.scheduledAt):now;
  if(Number.isNaN(scheduled.getTime()))return unavailable(route);
  const bits=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23",weekday:"short"}).formatToParts(scheduled);
  const get=(type:string)=>bits.find(p=>p.type===type)?.value||"";
  const day=get("year")+"-"+get("month")+"-"+get("day"),hour=Number(get("hour"));
  const holiday=await ukHoliday(day,pickup);
  const quote=calculateRecoveryPrice(rules[0].rule_config,route.distanceMiles,{
   vehicleType:String(b.vehicleType||""),nonRunning:b.runningStatus==="Non-running",lockedWheels:b.lockedWheels===true,
   accident:b.accident===true,urgent:b.urgent===true,night:hour<7||hour>=20,
   weekend:["Sat","Sun"].includes(get("weekday")),bankHoliday:holiday,loadingDifficulty:b.loadingDifficulty===true,specialEquipment:b.specialEquipment===true
  });
  return NextResponse.json({available:true,estimatedPriceGbp:quote.estimateGbp,route,disclaimer:"Estimated recovery price only. Independent drivers can submit different offers.",calculatedFor:day,serverTime:localDate},{headers:{"Cache-Control":"no-store"}});
 }catch{return unavailable();}
}
