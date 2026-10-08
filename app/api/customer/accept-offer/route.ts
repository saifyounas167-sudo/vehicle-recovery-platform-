import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(req:Request){
 try{
 const b=await req.json();if(typeof b.offerId!=="string"||!/^[0-9a-f-]{36}$/i.test(b.offerId))return NextResponse.json({error:"Invalid offer"},{status:400});
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:"Login required"},{status:401});
 const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();if(profile?.role!=="customer")return NextResponse.json({error:"Customer role required"},{status:403});
 const {data,error}=await db.rpc("accept_customer_offer",{p_offer_id:b.offerId});
 if(error)return NextResponse.json({error:"Unable to accept offer"},{status:503});
 if(data!==true)return NextResponse.json({error:"Offer unavailable or job already assigned"},{status:409});
 return NextResponse.json({accepted:true});
 }catch{return NextResponse.json({error:"Unable to accept offer"},{status:400});}
}
