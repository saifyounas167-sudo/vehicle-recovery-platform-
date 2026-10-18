import {isStripeBillingSandboxEnabled} from "@/src/lib/driver-billing-gate";
import {failClosed} from "@/src/lib/stripe-billing";
/** Cancellation is handled by Stripe Customer Portal: direct client cancellation is not trusted. */
export async function POST(){if(!isStripeBillingSandboxEnabled())return failClosed();return new Response(JSON.stringify({error:"Use the verified Stripe Customer Portal to schedule cancellation."}),{status:409,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})}
