import {createClient} from "@/lib/supabase/server";
import {isStripeBillingSandboxEnabled} from "@/src/lib/driver-billing-gate";
import {billingDb,stripeRequest,failClosed} from "@/src/lib/stripe-billing";
export async function POST(req:Request){
 if(!isStripeBillingSandboxEnabled())return failClosed();
 // Strictly server-selected price, never accept price IDs, amounts, or redirect URLs from clients.
 const origin=new URL(req.url).origin;
 try{
 const auth=await createClient();
 const {data:{user},error}=await auth.auth.getUser();if(error||!user)return new Response("Sign in required",{status:401});
 const {data:profile}=await auth.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(profile?.role!=="driver")return new Response("Driver account required",{status:403});
 const db=billingDb();
 const {data:price,error:priceErr}=await db.from("driver_billing_prices").select("stripe_price_id,currency,amount_pence").eq("active_for_new",true).maybeSingle();
 if(priceErr||!price||price.currency!=="gbp"||!/^price_[A-Za-z0-9]+$/.test(price.stripe_price_id||"")||!(price.amount_pence>0))return failClosed();
 const {data:existing}=await db.from("driver_billing_accounts").select("stripe_customer_id,subscription_id").eq("driver_id",user.id).maybeSingle();
 if(existing?.subscription_id)return new Response("Use your billing portal for existing subscriptions",{status:409});
 const form=new URLSearchParams({mode:"subscription",success_url:origin+"/driver/membership?checkout=returned",cancel_url:origin+"/driver/membership",client_reference_id:user.id,"line_items[0][price]":price.stripe_price_id,"line_items[0][quantity]":"1","metadata[driver_id]":user.id,"subscription_data[metadata][driver_id]":user.id});
 if(existing?.stripe_customer_id)form.set("customer",existing.stripe_customer_id);else if(user.email)form.set("customer_email",user.email);
 const session=await stripeRequest("POST","checkout/sessions",form);
 if(typeof session.url!=="string"||!session.url.startsWith("https://checkout.stripe.com/"))return failClosed();
 return Response.json({url:session.url},{headers:{"Cache-Control":"no-store"}});
 }catch{return failClosed()}
}
