import {createHmac,timingSafeEqual} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
import {isStripeBillingSandboxEnabled} from "./driver-billing-gate";
export function billingDb(){if(!isStripeBillingSandboxEnabled())throw Error("Billing disabled");return createClient(process.env.STAGING_SUPABASE_URL!,process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})}
export function verifyStripeSignature(body:string,header:string|null,secret:string,now=Date.now()){
 if(!header||!secret.startsWith("whsec_"))return false;
 const t=/\bt=(\d+)\b/.exec(header)?.[1];if(!t||Math.abs(now-Number(t)*1000)>300000)return false;
 const expected=createHmac("sha256",secret).update(t+"."+body).digest("hex");
 return header.split(",").some(part=>{const sig=part.trim().match(/^v1=([0-9a-f]{64})$/i)?.[1];return !!sig&&timingSafeEqual(Buffer.from(sig,"hex"),Buffer.from(expected,"hex"))});
}
export async function stripeRequest(method:"POST"|"GET",path:string,data?:URLSearchParams){
 if(!isStripeBillingSandboxEnabled())throw Error("Stripe test billing disabled");
 const key=process.env.STRIPE_SECRET_KEY!;
 const res=await fetch("https://api.stripe.com/v1/"+path,{method,headers:{Authorization:"Bearer "+key,...(data?{"Content-Type":"application/x-www-form-urlencoded"}:{})},body:data?.toString(),cache:"no-store"});
 const value=await res.json() as Record<string,unknown>;
 if(!res.ok)throw Error("Stripe request unsuccessful");
 return value;
}
export const failClosed=()=>new Response(JSON.stringify({error:"Stripe billing is not activated."}),{status:503,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
