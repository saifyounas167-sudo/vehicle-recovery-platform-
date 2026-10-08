import {NextResponse} from "next/server";
import {POST as calculateOpenEstimate} from "../open-estimate/route";
export const dynamic="force-dynamic";
// Compatibility adapter for PR9 clients. There is only one authoritative
// ORS road-mileage and admin-pricing engine: /api/recovery/open-estimate.
export async function POST(request:Request){
 try{
  if(Number(request.headers.get("content-length")||0)>16000)
   return NextResponse.json({error:"Payload too large"},{status:413});
  const b=await request.json();
  if(!b||typeof b!=="object"||Array.isArray(b))
   return NextResponse.json({error:"Invalid request"},{status:400});
  if(b.destinationMode!=="transport")
   return NextResponse.json({available:false,reason:"Price to be confirmed by recovery drivers"},{headers:{"Cache-Control":"no-store"}});
  const original=new Request("https://internal.invalid/api/recovery/open-estimate",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({
    pickupPostcode:b.pickupPostcode,
    destinationPostcode:b.destinationPostcode,
    vehicleType:b.vehicleType,
    runningStatus:b.runningStatus,
    lockedWheels:b.lockedWheels==="Yes",
    accident:b.accident==="Yes",
    urgent:b.timing==="urgent",
    specialEquipment:!!b.equipment,
    loadingDifficulty:!!b.difficulty,
    ...(b.timing==="Scheduled"&&b.preferredCollectionTime?{scheduledAt:new Date(b.preferredCollectionTime).toISOString()}:{})
   })
  });
  const result=await calculateOpenEstimate(original);
  const data=await result.json();
  if(!result.ok)return NextResponse.json(data,{status:result.status,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({
   available:data.available===true,
   estimateGbp:data.estimatedPriceGbp,
   distanceMiles:data.route?.distanceMiles??null,
   route:data.route??null,
   reason:data.message||data.disclaimer||"Price to be confirmed by recovery drivers",
   diagnosticStage:data.diagnosticStage
  },{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({available:false,reason:"Price to be confirmed by recovery drivers"},{headers:{"Cache-Control":"no-store"}});
 }
}
