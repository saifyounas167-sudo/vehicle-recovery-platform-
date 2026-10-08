import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {createHmac,timingSafeEqual,randomUUID} from "node:crypto";
export async function POST(request:Request){
 try{
  const secret=process.env.GUEST_REQUEST_HASH_SECRET,url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!secret||!url||!key)return NextResponse.json({error:"Upload unavailable"},{status:503});
  const form=await request.formData(),jobId=form.get("jobId"),reference=form.get("reference"),token=form.get("token"),photo=form.get("photo");
  if(typeof jobId!=="string"||!/^[0-9a-f-]{36}$/i.test(jobId)||typeof reference!=="string"||typeof token!=="string"||!/^[0-9a-f]{64}$/.test(token)||!(photo instanceof File))return NextResponse.json({error:"Invalid upload"},{status:400});
  const expected=createHmac("sha256",secret).update("photo|"+jobId+"|"+reference).digest("hex");
  if(!timingSafeEqual(Buffer.from(expected,"hex"),Buffer.from(token,"hex")))return NextResponse.json({error:"Not authorised"},{status:403});
  if(photo.size<1||photo.size>5*1024*1024||!["image/jpeg","image/png","image/webp"].includes(photo.type))return NextResponse.json({error:"Only JPG, PNG or WebP up to 5 MB"},{status:400});
  const bytes=Buffer.from(await photo.arrayBuffer());
  const valid=photo.type==="image/jpeg"?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:photo.type==="image/png"?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.subarray(0,4).toString()==="RIFF"&&bytes.subarray(8,12).toString()==="WEBP";
  if(!valid)return NextResponse.json({error:"Invalid image data"},{status:400});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:job}=await db.from("recovery_jobs").select("id,created_at").eq("id",jobId).eq("guest_reference",reference).maybeSingle();
  if(!job||Date.now()-new Date(job.created_at).getTime()>30*60*1000)return NextResponse.json({error:"Upload window expired"},{status:403});
  const {count}=await db.from("recovery_job_photo_access").select("storage_path",{count:"exact",head:true}).eq("job_id",jobId);
  if((count||0)>=3)return NextResponse.json({error:"Maximum three photos"},{status:400});
  const ext=photo.type==="image/jpeg"?"jpg":photo.type==="image/png"?"png":"webp",path=jobId+"/"+randomUUID()+"."+ext;
  const {error:uploadError}=await db.storage.from("recovery-vehicle-photos").upload(path,bytes,{contentType:photo.type,upsert:false});
  if(uploadError)return NextResponse.json({error:"Unable to store photo"},{status:503});
  const {error:dbError}=await db.from("recovery_job_photo_access").insert({job_id:jobId,storage_path:path});
  if(dbError){await db.storage.from("recovery-vehicle-photos").remove([path]);return NextResponse.json({error:"Unable to link photo"},{status:503});}
  return NextResponse.json({uploaded:true},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Upload failed"},{status:400});}
}
