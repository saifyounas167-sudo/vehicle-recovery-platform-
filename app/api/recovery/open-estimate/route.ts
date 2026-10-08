import {NextResponse} from "next/server";
import {createClient as createAdminClient} from "@supabase/supabase-js";
import {resolvePostcode,previewDrivingRoute} from "@/src/lib/open-routing";
import {calculateRecoveryPrice,validPricingConfig,ukHoliday,pricingKeys} from "@/src/lib/recovery-pricing";
export const dynamic="force-dynamic";
const pc=/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;
type Stage="validation"|"postcode"|"routing"|"pricing_config"|"pricing_query"|"holiday"|"calculation";
const unavailable=(stage:Stage,route?:unknown)=>NextResponse.json({available:false,message:"Price to be confirmed by recovery drivers",diagnosticStage:stage,...(route?{route}:{})},{headers:{"Cache-Control":"no-store"}});
const report=(stage:Stage,code:string)=>console.warn("[recovery-estimate]",{stage,code});
export async function POST(request:Request){
 let stage:Stage="validation";
 let route:Awaited<ReturnType<typeof previewDrivingRoute>>|undefined;
 try{
  if(Number(request.headers.get("content-length")||0)>4096)return NextResponse.json({error:"Request too large"},{status:413,headers:{"Cache-Control":"no-store"}});
  const input=await request.json(),pickup=String(input.pickupPostcode||"").trim(),destination=String(input.destinationPostcode||"").trim();
  if(!pc.test(pickup)||!pc.test(destination))return NextResponse.json({error:"Valid UK pickup and destination postcodes required"},{status:400,headers:{"Cache-Control":"no-store"}});
  stage="postcode";
  const [origin,end]=await Promise.all([resolvePostcode(pickup),resolvePostcode(destination)]);
  stage="routing";
  route=await previewDrivingRoute(origin,end);
  stage="pricing_config";
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key){report(stage,"missing_configuration");return unavailable(stage,route);}
  const db=createAdminClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  stage="pricing_query";
  const {data:rules,error}=await db.from("pricing_rules").select("name,rule_config").eq("active",true).limit(2);
  if(error){report(stage,error.code||"query_failed");return unavailable(stage,route);}
  stage="pricing_config";
  if(process.env.VERCEL_ENV==="production"&&rules?.some(r=>typeof r.name==="string"&&(/^(TEMP|TEST)(?:\s|$)/i.test(r.name.trim())))){report(stage,"temporary_rates_prohibited_in_production");return unavailable(stage,route);}
  if(!rules||rules.length!==1){report(stage,!rules?"missing_rules":rules.length===0?"no_active_rule":"multiple_active_rules");return unavailable(stage,route);}
  if(!validPricingConfig(rules[0].rule_config)){
   const cfg=rules[0].rule_config as Record<string,unknown>|null;
   // Only the names of missing/invalid required fields are logged; never prices or DB contents.
   const invalid=pricingKeys.filter(k=>typeof cfg?.[k]!=="number"||!Number.isFinite(cfg[k] as number)||(cfg[k] as number)<0);
   report(stage,"invalid_fields:"+invalid.join(","));
   return unavailable(stage,route);
  }
  const cfg=rules[0].rule_config;
  const now=new Date(),scheduled=typeof input.scheduledAt==="string"&&input.scheduledAt?new Date(input.scheduledAt):now;
  if(Number.isNaN(scheduled.getTime())){report("validation","invalid_schedule");return unavailable("validation",route);}
  const bits=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23",weekday:"short"}).formatToParts(scheduled);
  const get=(type:string)=>bits.find(p=>p.type===type)?.value||"";
  const day=get("year")+"-"+get("month")+"-"+get("day"),hour=Number(get("hour"));
  stage="holiday";
  // A holiday lookup must not prevent estimates when the configured surcharge is zero.
  const holiday=cfg.bankHolidaySurcharge>0?await ukHoliday(day,pickup):false;
  stage="calculation";
  const quote=calculateRecoveryPrice(cfg,route.distanceMiles,{
   vehicleType:String(input.vehicleType||""),nonRunning:input.runningStatus==="Non-running",lockedWheels:input.lockedWheels===true,
   accident:input.accident===true,urgent:input.urgent===true,night:hour<7||hour>=20,
   weekend:["Sat","Sun"].includes(get("weekday")),bankHoliday:holiday,loadingDifficulty:input.loadingDifficulty===true,specialEquipment:input.specialEquipment===true
  });
  return NextResponse.json({available:true,estimatedPriceGbp:quote.estimateGbp,route,disclaimer:"Estimated recovery price only. Independent drivers can submit different offers.",calculatedFor:day},{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  // Do not include exceptions, request data, secrets, postcodes, coordinates, or API keys.
  report(stage,e instanceof Error?e.name:"unknown_error");
  return unavailable(stage,route);
 }
}
