import {isStripeBillingSandboxEnabled} from "@/src/lib/driver-billing-gate";
import {billingDb,stripeRequest,verifyStripeSignature,failClosed} from "@/src/lib/stripe-billing";
export const runtime="nodejs";
const statuses=new Set(["pending","active","past_due","cancelled","expired"]);
const iso=(seconds:unknown)=>typeof seconds==="number"&&Number.isSafeInteger(seconds)&&seconds>0?new Date(seconds*1000).toISOString():null;
const str=(v:unknown)=>typeof v==="string"?v:null;
export async function POST(req:Request){
 if(!isStripeBillingSandboxEnabled())return failClosed();
 const body=await req.text();
 if(body.length>180000)return new Response("Request too large",{status:413});
 if(!verifyStripeSignature(body,req.headers.get("stripe-signature"),process.env.STRIPE_WEBHOOK_SECRET!))return new Response("Invalid signature",{status:400});
 try{
 const event=JSON.parse(body) as {id:string;type:string;created:number;data:{object:Record<string,unknown>}};
 if(!/^evt_[A-Za-z0-9]+$/.test(event.id)||!event.data?.object)return new Response("Invalid event",{status:400});
 const db=billingDb();
 // Re-fetch verified event from Stripe to avoid trusting event payload for billing state.
 const verified=await stripeRequest("GET","events/"+encodeURIComponent(event.id));
 if(verified.id!==event.id||verified.type!==event.type)return new Response("Event mismatch",{status:400});
 const {data:seen}=await db.from("driver_billing_events").select("event_id").eq("event_id",event.id).maybeSingle();
 if(seen)return Response.json({received:true});
 const obj=(verified.data as {object?:Record<string,unknown>})?.object||{};
 const customer=str(obj.customer);
 if(event.type==="checkout.session.completed" && str(obj.mode)==="subscription"){
  const driverId=str(obj.client_reference_id);const subId=str(obj.subscription);
  if(driverId&&subId&&customer){
   // Re-fetch subscription: Checkout browser return alone never activates membership.
   const subscription=await stripeRequest("GET","subscriptions/"+encodeURIComponent(subId));
   if(subscription.customer===customer){
    const state=str(subscription.status),period=iso(subscription.current_period_end);
    await db.from("driver_billing_accounts").upsert({driver_id:driverId,stripe_customer_id:customer,subscription_id:subId,stripe_price_id:null,current_period_end:period,updated_at:new Date().toISOString()},{onConflict:"driver_id"});
    const mapped=state==="active"?"active":state==="past_due"?"past_due":"pending";
    await db.from("driver_memberships").upsert({driver_id:driverId,status:mapped,valid_until:mapped==="active"?period:null,updated_at:new Date().toISOString()},{onConflict:"driver_id"});
   }
  }
 }
 if(["customer.subscription.updated","customer.subscription.deleted","invoice.paid","invoice.payment_failed"].includes(event.type)&&customer){
  const {data:account}=await db.from("driver_billing_accounts").select("driver_id,subscription_id").eq("stripe_customer_id",customer).maybeSingle();
  if(account){
   if(event.type.startsWith("customer.subscription.")){
    if(obj.id===account.subscription_id){
     const state=event.type==="customer.subscription.deleted"?"cancelled":str(obj.status)==="active"?"active":str(obj.status)==="past_due"?"past_due":str(obj.status)==="canceled"?"cancelled":"pending";
     if(statuses.has(state)){
      const period=iso(obj.current_period_end);
      await db.from("driver_billing_accounts").update({current_period_end:period,cancel_at_period_end:obj.cancel_at_period_end===true,updated_at:new Date().toISOString()}).eq("driver_id",account.driver_id);
      await db.from("driver_memberships").upsert({driver_id:account.driver_id,status:state,valid_until:state==="active"?period:null,updated_at:new Date().toISOString()},{onConflict:"driver_id"});
     }
    }
   }else{
    const invoiceId=str(obj.id);
    if(invoiceId&&str(obj.subscription)===account.subscription_id){
     await db.from("driver_billing_payments").upsert({stripe_invoice_id:invoiceId,driver_id:account.driver_id,amount_paid_pence:Math.max(0,Number(obj.amount_paid)||0),currency:str(obj.currency)||"gbp",status:event.type==="invoice.paid"?"paid":"failed",paid_at:event.type==="invoice.paid"?new Date().toISOString():null},{onConflict:"stripe_invoice_id"});
     // Renewal membership state derives from Stripe subscription status, never invoice alone.
    }
   }
  }
 }
 const {error}=await db.from("driver_billing_events").insert({event_id:event.id,event_type:event.type,event_created:iso(verified.created)||new Date().toISOString()});
 if(error)return new Response("Retry later",{status:500});
 return Response.json({received:true});
 }catch{return new Response("Retry later",{status:500})}
}
