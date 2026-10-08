import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRouteEstimate } from "@/src/lib/maps";
import { calculateEstimate } from "@/src/lib/pricing";
export const dynamic="force-dynamic";
const services=new Set(["Breakdown Recovery","Accident Recovery","Vehicle Transport","Car Towing","Jump Start / Flat Battery Assistance","Flat Tyre Assistance","Motorbike Recovery","Van Recovery","Auction Vehicle Collection","Non-Running Vehicle Transport"]);
const postcode=/^(GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}))$/i;
type Rules={minimumCallout?:number;pricePerMile?:number;vehicleSurcharges?:Record<string,number>;serviceSurcharges?:Record<string,number>;nonRunningSurcharge?:number;lockedWheelSurcharge?:number;damagedWheelSurcharge?:number;accidentSurcharge?:number;nightSurcharge?:number;weekendSurcharge?:number;bankHolidaySurcharge?:number;urgentSurcharge?:number;equipmentSurcharge?:number;difficultySurcharge?:number};
const unavailable=(reason:string)=>NextResponse.json({available:false,reason},{headers:{"Cache-Control":"no-store"}});
export async function POST(req:Request){
 try{
  if(Number(req.headers.get("content-length")||0)>16000)return NextResponse.json({error:"Payload too large"},{status:413});
  const b=await req.json();if(!b||typeof b!=="object")return NextResponse.json({error:"Invalid request"},{status:400});
  if(!postcode.test(String(b.pickupPostcode||""))||!services.has(b.recoveryType))return NextResponse.json({error:"Valid pickup and service required"},{status:400});
  if(b.destinationMode==="transport"&&!postcode.test(String(b.destinationPostcode||"")))return NextResponse.json({error:"Valid destination required"},{status:400});
  if(!["transport","Nearest Garage","Roadside Assistance Without Transport"].includes(b.destinationMode))return NextResponse.json({error:"Invalid destination option"},{status:400});
  if(!b.vehicleType||!b.runningStatus)return NextResponse.json({error:"Vehicle details required"},{status:400});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return unavailable("Pricing database is not configured");
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.from("pricing_rules").select("rule_config").eq("active",true).limit(1).maybeSingle();
  if(error||!data)return unavailable("Admin pricing rules are not configured");
  const rules=data.rule_config as Rules;
  const valid=(n:unknown)=>typeof n==="number"&&Number.isFinite(n)&&n>=0;
  if(!valid(rules.minimumCallout)||!valid(rules.pricePerMile))return unavailable("Minimum call-out or mileage pricing is missing");
  let miles=0;
  if(b.destinationMode==="transport"){
   try{const route=await getRouteEstimate(String(b.pickupPostcode),String(b.destinationPostcode));miles=route.distanceMiles;if(!valid(miles))return unavailable("Driving distance unavailable");}
   catch{return unavailable("Driving distance unavailable; routing provider is not configured or could not find a route");}
  }
  const extras=[rules.vehicleSurcharges?.[String(b.vehicleType)],rules.serviceSurcharges?.[String(b.recoveryType)],b.runningStatus==="Non-running"?rules.nonRunningSurcharge:0,b.lockedWheels==="Yes"?rules.lockedWheelSurcharge:0,b.damagedWheels==="Yes"?rules.damagedWheelSurcharge:0,b.accident==="Yes"?rules.accidentSurcharge:0,b.timing==="urgent"?rules.urgentSurcharge:0,b.equipment?rules.equipmentSurcharge:0,b.difficulty?rules.difficultySurcharge:0];
  const time=b.timing==="Scheduled"&&b.preferredCollectionTime?new Date(b.preferredCollectionTime):new Date();
  if(!Number.isFinite(time.getTime()))return unavailable("Invalid collection time");
  const hour=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",hour:"2-digit",hourCycle:"h23"}).format(time));
  const weekday=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",weekday:"short"}).format(time);
  if(hour<7||hour>=19)extras.push(rules.nightSurcharge);
  if(weekday==="Sat"||weekday==="Sun")extras.push(rules.weekendSurcharge);
  // Bank holiday calendars require an authoritative configured provider; never assume a date is a bank holiday.
  if(extras.some(x=>x!==undefined&&!valid(x)))return unavailable("Invalid pricing configuration");
  const fee=extras.reduce<number>((sum,x)=>sum+(typeof x==="number"?x:0),0);
  const result=calculateEstimate({baseFee:rules.minimumCallout,distanceMiles:miles,distanceRate:rules.pricePerMile,equipmentFee:fee});
  return NextResponse.json({available:true,estimateGbp:result.estimateGbp,distanceMiles:b.destinationMode==="transport"?miles:null,bankHolidayPricing:"not configured"},{headers:{"Cache-Control":"no-store"}});
 }catch{return unavailable("Estimate currently unavailable");}
}
