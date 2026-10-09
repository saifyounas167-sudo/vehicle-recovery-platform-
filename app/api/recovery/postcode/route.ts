import {NextResponse} from "next/server";
const ukPostcode=/^(GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}))$/i;
const coordinates=(v:number,min:number,max:number)=>Number.isFinite(v)&&v>=min&&v<=max;
export async function GET(request:Request){
 const q=new URL(request.url).searchParams;
 const postcode=q.get("postcode")?.trim().toUpperCase();
 const latRaw=q.get("lat"),lngRaw=q.get("lng");
 if(postcode!==undefined){
  if(!ukPostcode.test(postcode))return NextResponse.json({error:"Invalid UK postcode format"},{status:400});
  try{
   const res=await fetch("https://api.postcodes.io/postcodes/"+encodeURIComponent(postcode),{cache:"no-store",signal:AbortSignal.timeout(6000)});
   if(res.status===404)return NextResponse.json({valid:false,postcode,error:"Postcode not found; check or confirm the address manually"},{headers:{"Cache-Control":"no-store"}});
   if(!res.ok)throw new Error("Provider unavailable");
   const data=await res.json();const result=data.result;
   return NextResponse.json({valid:true,postcode:result.postcode,latitude:result.latitude,longitude:result.longitude,precision:"postcode centroid; not an exact street address"},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({valid:null,postcode,reason:"Postcode lookup unavailable; manual address confirmation is supported"},{headers:{"Cache-Control":"no-store"}});}
 }
 if(latRaw===null||lngRaw===null)return NextResponse.json({error:"Coordinates or postcode required"},{status:400});
 const lat=Number(latRaw),lng=Number(lngRaw);
 if(!coordinates(lat,49,61)||!coordinates(lng,-9,3))return NextResponse.json({error:"Invalid UK coordinates"},{status:400});
 try{
  const url=new URL("https://api.postcodes.io/postcodes");url.searchParams.set("lat",String(lat));url.searchParams.set("lon",String(lng));url.searchParams.set("limit","1");
  const res=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(6000)});if(!res.ok)throw new Error();
  const data=await res.json(),match=data.result?.[0];
  if(!match?.postcode)return NextResponse.json({error:"No nearby postcode found; enter one manually"},{status:404});
  return NextResponse.json({postcode:match.postcode,precision:"Nearest postcode only; confirm the actual pickup address"},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Postcode lookup unavailable; enter postcode manually"},{status:503});}
}
