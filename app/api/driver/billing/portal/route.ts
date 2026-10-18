import {createClient} from "@/lib/supabase/server";
import {isStripeBillingSandboxEnabled} from "@/src/lib/driver-billing-gate";
import {billingDb,stripeRequest,failClosed} from "@/src/lib/stripe-billing";
export async function POST(req:Request){
 if(!isStripeBillingSandboxEnabled())return failClosed();
 try{
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();
 if(!user)return new Response("Sign in required",{status:401});
 const {data:p}=await auth.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(p?.role!=="driver")return new Response("Driver account required",{status:403});
 const db=billingDb();const {data:a}=await db.from("driver_billing_accounts").select("stripe_customer_id").eq("driver_id",user.id).maybeSingle();
 if(!a?.stripe_customer_id)return new Response("Billing account unavailable",{status:404});
 const form=new URLSearchParams({customer:a.stripe_customer_id,return_url:new URL(req.url).origin+"/driver/membership"});
 const session=await stripeRequest("POST","billing_portal/sessions",form);
 if(typeof session.url!=="string"||!session.url.startsWith("https://billing.stripe.com/"))return failClosed();
 return Response.json({url:session.url},{headers:{"Cache-Control":"no-store"}});
 }catch{return failClosed()}
}
