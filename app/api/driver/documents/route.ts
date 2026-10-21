import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {serverDb} from "@/src/lib/guest-access";
import {isDriverRegistrationEnabled} from "@/src/lib/driver-registration-gate";
import {randomUUID} from "node:crypto";
export const dynamic="force-dynamic";
const json=(x:unknown,status=200)=>NextResponse.json(x,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(req:Request){
 if(!(await isDriverRegistrationEnabled()))return json({error:"Uploads are paused in client-review mode"},503);
 try{
  const dbAuth=await createClient(),{data:{user}}=await dbAuth.auth.getUser();
  if(!user)return json({error:"Verified sign-in required"},401);
  const db=serverDb(),{data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="driver")return json({error:"Driver role required"},403);
  const {data:driver}=await db.from("driver_profiles").select("approval_status").eq("id",user.id).maybeSingle();
  if(!driver||!["pending","rejected"].includes(driver.approval_status))return json({error:"Application must be pending review"},409);
  const form=await req.formData(),file=form.get("file"),kind=form.get("documentType");
  if(!(file instanceof File)||!["insurance","valid_id","profile_photo","truck_photo"].includes(String(kind)))return json({error:"Unsupported document"},400);
  if(file.size<=0||file.size>5242880||!["application/pdf","image/jpeg","image/png"].includes(file.type))return json({error:"Upload a PDF, JPG or PNG under 5 MB"},400);
  const buffer=new Uint8Array(await file.arrayBuffer());
  const pdf=buffer[0]===37&&buffer[1]===80&&buffer[2]===68&&buffer[3]===70&&buffer[4]===45;
  const jpg=buffer[0]===255&&buffer[1]===216&&buffer[2]===255;
  const png=buffer[0]===137&&buffer[1]===80&&buffer[2]===78&&buffer[3]===71;
  if(!((file.type==="application/pdf"&&pdf)||(file.type==="image/jpeg"&&jpg)||(file.type==="image/png"&&png)))return json({error:"Document content does not match file type"},400);
  if(["profile_photo","truck_photo"].includes(String(kind))&&pdf)return json({error:"Photos must be JPG or PNG"},400);
  const ext=pdf?"pdf":jpg?"jpg":"png",path=user.id+"/"+randomUUID()+"."+ext;
  const {error:uploadError}=await db.storage.from("driver-verification-private").upload(path,buffer,{contentType:file.type,upsert:false});
  if(uploadError)return json({error:"Secure document storage unavailable"},503);
  const {error:insertError}=await db.from("driver_verification_documents").insert({driver_id:user.id,document_type:kind,storage_path:path});
  if(insertError){await db.storage.from("driver-verification-private").remove([path]);return json({error:"Unable to save document record"},503);}
  return json({stored:true,message:"Document uploaded privately for admin review"},201);
 }catch{return json({error:"Document upload failed"},503);}
}

/** Driver may list/view ONLY their own private uploaded documents. Never expose storage paths. */
export async function GET(req:Request){
 if(!(await isDriverRegistrationEnabled()))return json({error:"Document review is available only in isolated Staging"},503);
 try{
  const auth=await createClient(),{data:{user}}=await auth.auth.getUser();
  if(!user)return json({error:"Login required"},401);
  const db=serverDb();
  const {data:profile,error:profileError}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profileError||profile?.role!=="driver")return json({error:"Driver role required"},403);
  const {data:driver,error:driverError}=await db.from("driver_profiles").select("id").eq("id",user.id).maybeSingle();
  if(driverError||!driver)return json({error:"Driver application required"},404);
  const id=new URL(req.url).searchParams.get("documentId");
  if(id){
   if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id))return json({error:"Invalid document ID"},400);
   const {data:doc,error}=await db.from("driver_verification_documents").select("storage_path").eq("id",id).eq("driver_id",user.id).maybeSingle();
   if(error||!doc||!doc.storage_path.startsWith(user.id+"/"))return json({error:"Document not found"},404);
   const {data:signed,error:signErr}=await db.storage.from("driver-verification-private").createSignedUrl(doc.storage_path,60);
   if(signErr||!signed?.signedUrl)return json({error:"Document temporarily unavailable"},503);
   return json({url:signed.signedUrl,expiresInSeconds:60});
  }
  const {data,error}=await db.from("driver_verification_documents").select("id,document_type,created_at").eq("driver_id",user.id).order("created_at",{ascending:false}).limit(50);
  if(error)return json({error:"Documents temporarily unavailable"},503);
  return json({documents:(data??[]).map(d=>({id:d.id,type:d.document_type,uploadedAt:d.created_at}))});
 }catch{return json({error:"Unable to access documents"},503)}
}
