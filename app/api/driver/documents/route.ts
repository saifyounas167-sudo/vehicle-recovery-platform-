import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {serverDb} from "@/src/lib/guest-access";
import {isClientReviewDemo} from "@/src/lib/client-review";
import {randomUUID} from "node:crypto";
export const dynamic="force-dynamic";
const json=(x:unknown,status=200)=>NextResponse.json(x,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(req:Request){
 if(isClientReviewDemo()&&!isIsolatedMarketplaceStaging())return json({error:"Uploads are paused in client-review mode"},503);
 try{
  const dbAuth=await createClient(),{data:{user}}=await dbAuth.auth.getUser();
  if(!user||!user.email_confirmed_at)return json({error:"Verified sign-in required"},401);
  const db=serverDb(),{data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="driver")return json({error:"Driver role required"},403);
  const {data:driver}=await db.from("driver_profiles").select("approval_status").eq("id",user.id).maybeSingle();
  if(!driver||!["pending","rejected"].includes(driver.approval_status))return json({error:"Application must be pending review"},409);
  const form=await req.formData(),file=form.get("file"),kind=form.get("documentType");
  if(!(file instanceof File)||!["insurance","driving_licence","business","other"].includes(String(kind)))return json({error:"Unsupported document"},400);
  if(file.size<=0||file.size>5242880||!["application/pdf","image/jpeg","image/png"].includes(file.type))return json({error:"Upload a PDF, JPG or PNG under 5 MB"},400);
  const buffer=new Uint8Array(await file.arrayBuffer());
  const pdf=buffer[0]===37&&buffer[1]===80&&buffer[2]===68&&buffer[3]===70&&buffer[4]===45;
  const jpg=buffer[0]===255&&buffer[1]===216&&buffer[2]===255;
  const png=buffer[0]===137&&buffer[1]===80&&buffer[2]===78&&buffer[3]===71;
  if(!((file.type==="application/pdf"&&pdf)||(file.type==="image/jpeg"&&jpg)||(file.type==="image/png"&&png)))return json({error:"Document content does not match file type"},400);
  const ext=pdf?"pdf":jpg?"jpg":"png",path=user.id+"/"+randomUUID()+"."+ext;
  const {error:uploadError}=await db.storage.from("driver-verification-private").upload(path,buffer,{contentType:file.type,upsert:false});
  if(uploadError)return json({error:"Secure document storage unavailable"},503);
  const {error:insertError}=await db.from("driver_verification_documents").insert({driver_id:user.id,document_type:kind,storage_path:path});
  if(insertError){await db.storage.from("driver-verification-private").remove([path]);return json({error:"Unable to save document record"},503);}
  return json({stored:true,message:"Document uploaded privately for admin review"},201);
 }catch{return json({error:"Document upload failed"},503);}
}
