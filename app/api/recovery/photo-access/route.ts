import {NextResponse} from "next/server";
import {serverDb,validGuestProof} from "@/src/lib/guest-access";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export async function POST(req:Request){
 try{
  const b=await req.json();if(typeof b.jobId!=="string"||typeof b.storagePath!=="string"||!b.storagePath.startsWith(b.jobId+"/"))return NextResponse.json({error:"Invalid request"},{status:400});
  const db=serverDb();const {data:job}=await db.from("recovery_jobs").select("id,guest_reference,customer_id,assigned_driver_id,status").eq("id",b.jobId).maybeSingle();
  if(!job)return NextResponse.json({error:"Not found"},{status:404});
  let allowed=typeof b.proof==="string"&&typeof b.reference==="string"&&b.reference===job.guest_reference&&validGuestProof(job.id,b.reference,b.proof);
  if(!allowed){
   const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
   if(user){
    if(job.customer_id===user.id)allowed=true;
    else{
     const {data:profile}=await auth.from("profiles").select("role").eq("id",user.id).maybeSingle();
     if(profile?.role==="admin")allowed=true;
     else if(profile?.role==="driver"){
      const {data:driver}=await auth.from("driver_profiles").select("approval_status").eq("id",user.id).maybeSingle();
      allowed=driver?.approval_status==="approved"&&(job.assigned_driver_id===user.id||["submitted","matching","offered"].includes(job.status));
     }
    }
   }
  }
  if(!allowed)return NextResponse.json({error:"Not authorised"},{status:403});
  const {data:record}=await db.from("recovery_job_photo_access").select("storage_path").eq("job_id",job.id).eq("storage_path",b.storagePath).maybeSingle();
  if(!record)return NextResponse.json({error:"Photo not found"},{status:404});
  const {data,error}=await db.storage.from("recovery-vehicle-photos").createSignedUrl(record.storage_path,60);
  if(error||!data)return NextResponse.json({error:"Photo unavailable"},{status:503});
  return NextResponse.json({url:data.signedUrl,expiresInSeconds:60},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Unable to access photo"},{status:400});}
}
