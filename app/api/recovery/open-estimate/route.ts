import {NextResponse} from "next/server";
import {resolvePostcode,previewDrivingRoute} from "@/src/lib/open-routing";
import {createClient} from "@/lib/supabase/server";
import {calculateEstimate} from "@/src/lib/pricing";
export const dynamic="force-dynamic";
const pc=/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;
export async function POST(request:Request){
 try{
  if(Number(request.headers.get("content-length")||0)>4096)return NextResponse.json({error:"Request too large"},{status:413});
  const input=await request.json();
  const pickup=String(input.pickupPostcode||"").trim(),destination=String(input.destinationPostcode||"").trim();
  if(!pc.test(pickup)||!pc.test(destination))return NextResponse.json({error:"Enter valid UK pickup and destination postcodes"},{status:400});
  const [origin,end]=await Promise.all([resolvePostcode(pickup),resolvePostcode(destination)]);
  const route=await previewDrivingRoute(origin,end);
  const supabase=await createClient();
  const {data:rules,error}=await supabase.from("pricing_rules").select("rule_config").eq("active",true).limit(2);
  if(error||!rules||rules.length!==1)return NextResponse.json({available:false,message:"Price to be confirmed by recovery drivers",route},{headers:{"Cache-Control":"no-store"}});
  const cfg=rules[0].rule_config as Record<string,unknown>;
  const minimum=cfg.minimumCallout,perMile=cfg.pricePerMile;
  if(typeof minimum!=="number"||typeof perMile!=="number"||!Number.isFinite(minimum)||!Number.isFinite(perMile)||minimum<0||perMile<0)return NextResponse.json({available:false,message:"Price to be confirmed by recovery drivers",route},{headers:{"Cache-Control":"no-store"}});
  // Missing or unconfirmed surcharge configuration must never be silently treated as zero.
  const factors=["vehicleSurcharge","nonRunningSurcharge","lockedWheelSurcharge","accidentSurcharge","nightSurcharge","weekendSurcharge","bankHolidaySurcharge","urgentSurcharge"];
  if(factors.some(key=>typeof cfg[key]!=="number"||!Number.isFinite(cfg[key] as number)||(cfg[key] as number)<0))return NextResponse.json({available:false,message:"Price to be confirmed by recovery drivers",route},{headers:{"Cache-Control":"no-store"}});
  const fee=(input.vehicleType==="Van"?cfg.vehicleSurcharge as number:0)+(input.runningStatus==="Non-running"?cfg.nonRunningSurcharge as number:0)+(input.lockedWheels===true?cfg.lockedWheelSurcharge as number:0)+(input.accident===true?cfg.accidentSurcharge as number:0)+(input.urgent===true?cfg.urgentSurcharge as number:0);
  // Time-dependent surcharges need a verified UK-local calendar/time model; fail closed for now.
  if(input.scheduledAt||input.urgent)return NextResponse.json({available:false,message:"Price to be confirmed by recovery drivers",route},{headers:{"Cache-Control":"no-store"}});
  const quote=calculateEstimate({baseFee:minimum,distanceMiles:route.distanceMiles,distanceRate:perMile,equipmentFee:fee});
  return NextResponse.json({available:true,estimatedPriceGbp:quote.estimateGbp,route,disclaimer:"Estimated recovery price only. Drivers submit their own quotes."},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({available:false,message:"Price to be confirmed by recovery drivers"},{headers:{"Cache-Control":"no-store"}});}
}
