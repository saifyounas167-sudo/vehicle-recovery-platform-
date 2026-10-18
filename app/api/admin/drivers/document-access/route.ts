import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {serverDb} from "@/src/lib/guest-access";
import {isDriverRegistrationEnabled} from "@/src/lib/driver-registration-gate";
import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 const fail=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
 if(!isDriverRegistrationEnabled())return fail("Admin review paused",503);
 try{
  const auth=await createClient(),{data:{user}}=await auth.auth.getUser();
  if(!user)return fail("Admin login required",401);
  const db=serverDb(),{data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="admin")return fail("Admin permission required",403);
  const url=new URL(req.url),documentId=url.searchParams.get("documentId");
  if(!documentId||!/^[\da-f-]{36}$/i.test(documentId))return fail("Document ID required",400);
  const {data:document,error}=await db.from("driver_verification_documents").select("storage_path").eq("id",documentId).maybeSingle();
  if(error||!document)return fail("Document not found",404);
  const {data:signed,error:signError}=await db.storage.from("driver-verification-private").createSignedUrl(document.storage_path,60);
  if(signError||!signed?.signedUrl)return fail("Secure document access unavailable",503);
  return NextResponse.json({url:signed.signedUrl,expiresInSeconds:60},{headers:{"Cache-Control":"no-store"}});
 }catch{return fail("Unable to view document",503);}
}
