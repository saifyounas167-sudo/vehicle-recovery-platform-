import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {validPricingConfig} from "@/src/lib/recovery-pricing";
export async function PUT(request:Request){
 try{
 if(Number(request.headers.get("content-length")||0)>8192)return NextResponse.json({error:"Request too large"},{status:413});
 const input=await request.json();if(typeof input.id!=="string"||!/^[0-9a-f-]{36}$/i.test(input.id)||!validPricingConfig(input.ruleConfig))return NextResponse.json({error:"Invalid pricing rules"},{status:400});
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:"Login required"},{status:401});
 const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();if(profile?.role!=="admin")return NextResponse.json({error:"Admin only"},{status:403});
 const {error}=await db.from("pricing_rules").update({rule_config:input.ruleConfig,updated_at:new Date().toISOString()}).eq("id",input.id);
 if(error)return NextResponse.json({error:"Unable to save pricing"},{status:400});
 return NextResponse.json({saved:true});
 }catch{return NextResponse.json({error:"Unable to update pricing"},{status:400});}
}
