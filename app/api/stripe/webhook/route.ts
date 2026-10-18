import {isStripeBillingSandboxEnabled} from "@/src/lib/driver-billing-gate";
import {billingDb,stripeRequest,verifyStripeSignature,failClosed} from "@/src/lib/stripe-billing";
export const runtime="nodejs";
const text=(v:unknown)=>typeof v==="string"?v:null;
const at=(v:unknown)=>typeof v==="number"&&Number.isSafeInteger(v)&&v>0?new Date(v*1000).toISOString():null;
const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const code=/^[a-z]+_[a-zA-Z0-9]+$/;
export async function POST(request:Request){
 if(!isStripeBillingSandboxEnabled())return failClosed();
 const body=await request.text();
 if(body.length>180000)return new Response("Payload too large",{status:413});
 if(!verifyStripeSignature(body,request.headers.get("stripe-signature"),process.env.STRIPE_WEBHOOK_SECRET||""))return new Response("Invalid signature",{status:400});
 try{
  const event=JSON.parse(body) as {id?:string;type?:string;created?:number};
  if(!event.id||!/^evt_[a-zA-Z0-9]+$/.test(event.id))return new Response("Invalid event",{status:400});
  const verified=await stripeRequest("GET","events/"+encodeURIComponent(event.id));
  if(verified.id!==event.id||verified.type!==event.type||verified.created!==event.created)return new Response("Event mismatch",{status:400});
  const kind=text(verified.type)||"";
  const supported=["checkout.session.completed","customer.subscription.updated","customer.subscription.deleted","invoice.paid","invoice.payment_failed"];
  if(!supported.includes(kind))return Response.json({received:true,ignored:true});
  const eventObject=(verified.data as {object?:Record<string,unknown>}|undefined)?.object;
  if(!eventObject)return new Response("Missing Stripe object",{status:400});
  const db=billingDb();
  const customer=text(eventObject.customer);
  let driverId:string|null=null,subscriptionId:string|null=null;
  if(kind==="checkout.session.completed"){
   if(eventObject.mode!=="subscription"||eventObject.payment_status==="unpaid")return Response.json({received:true,ignored:true});
   driverId=text(eventObject.client_reference_id);
   subscriptionId=text(eventObject.subscription);
   if(!driverId||!uuid.test(driverId)||!subscriptionId||!customer)return new Response("Missing identity",{status:400});
   // Billing identity can only be bound through Stripe's verified Checkout.
   const meta=eventObject.metadata as Record<string,unknown>|undefined;
   if(meta?.driver_id!==driverId)return new Response("Checkout identity mismatch",{status:409});
  }else{
   if(!customer)return new Response("Missing customer",{status:400});
   const {data:account,error}=await db.from("driver_billing_accounts").select("driver_id,subscription_id").eq("stripe_customer_id",customer).maybeSingle();
   if(error)return new Response("Billing lookup failed",{status:503});
   if(!account)return new Response("Billing identity not linked yet",{status:503});
   driverId=account.driver_id;
   subscriptionId=account.subscription_id;
   if(kind.startsWith("customer.subscription.")&&eventObject.id!==subscriptionId)return new Response("Subscription mismatch",{status:409});
   if(kind.startsWith("invoice.")&&eventObject.subscription!==subscriptionId)return Response.json({received:true,ignored:true});
  }
  if(!customer||!subscriptionId||!driverId||!code.test(customer)||!code.test(subscriptionId))return new Response("Invalid identity",{status:400});
  // Fetch CURRENT subscription and latest invoice. Never promote state from a delayed event snapshot.
  const current=await stripeRequest("GET","subscriptions/"+encodeURIComponent(subscriptionId),new URLSearchParams());
  if(current.customer!==customer)return new Response("Subscription identity mismatch",{status:409});
  const items=current.items as {data?:Array<{price?:{id?:unknown}}>}|undefined;
  const priceId=text(items?.data?.[0]?.price?.id);
  if(!priceId||!/^price_[a-zA-Z0-9]+$/.test(priceId))return new Response("Missing trusted price",{status:503});
  const period=at(current.current_period_end);
  const latest=current.latest_invoice;
  let paid=false;
  if(typeof latest==="string"&&latest.startsWith("in_")){
   const invoice=await stripeRequest("GET","invoices/"+encodeURIComponent(latest));
   paid=invoice.status==="paid"&&invoice.subscription===subscriptionId&&invoice.customer===customer;
  }else if(latest&&typeof latest==="object"){
   const invoice=latest as Record<string,unknown>;
   paid=invoice.status==="paid"&&invoice.subscription===subscriptionId&&invoice.customer===customer;
  }
  const stripeStatus=text(current.status);
  const state=stripeStatus==="canceled"?"cancelled":stripeStatus==="past_due"||stripeStatus==="unpaid"?"past_due":
   stripeStatus==="active"&&paid&&period&&new Date(period)>new Date()?"active":stripeStatus==="active"?"pending":"pending";
  if(kind==="customer.subscription.deleted"&&stripeStatus!=="canceled")return new Response("Subscription state not reconciled",{status:503});
  let invoiceId:string|null=null,invoiceState:string|null=null,amount:number|null=null,currency:string|null=null;
  if(kind.startsWith("invoice.")){
   invoiceId=text(eventObject.id);
   invoiceState=kind==="invoice.paid"?"paid":"failed";
   amount=Number(eventObject.amount_paid);
   currency=text(eventObject.currency);
   if(!invoiceId||!Number.isSafeInteger(amount)||amount<0)return new Response("Invalid invoice",{status:400});
  }
  const stamp=at(verified.created);
  if(!stamp)return new Response("Invalid event timestamp",{status:400});
  // One PostgreSQL transaction owns event deduplication, invoice history and membership state.
  const {data,error}=await db.rpc("apply_verified_driver_billing_event",{
   p_event_id:event.id,p_event_type:kind,p_created:stamp,p_driver_id:driverId,
   p_customer:customer,p_subscription:subscriptionId,p_price:priceId,
   p_state:state,p_period_end:period,p_cancel_at_period_end:current.cancel_at_period_end===true,
   p_invoice:invoiceId,p_invoice_state:invoiceState,p_amount:amount,p_currency:currency
  });
  if(error)return new Response("Billing reconciliation failed",{status:503});
  return Response.json({received:true,result:data},{headers:{"Cache-Control":"no-store"}});
 }catch{return new Response("Billing reconciliation pending retry",{status:503})}
}
