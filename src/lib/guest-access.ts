import {createClient} from "@supabase/supabase-js";
import {createHmac,timingSafeEqual} from "node:crypto";
export function serverDb(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Server database not configured");return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});}
export function guestProof(jobId:string,reference:string){const secret=process.env.GUEST_REQUEST_HASH_SECRET;if(!secret||secret.length<32)throw new Error("Guest signing secret missing");return createHmac("sha256",secret).update("guest|"+jobId+"|"+reference).digest("hex");}
export function validGuestProof(jobId:string,reference:string,proof:string){if(!/^[a-f0-9]{64}$/i.test(proof))return false;const expected=guestProof(jobId,reference);return timingSafeEqual(Buffer.from(expected,"hex"),Buffer.from(proof,"hex"));}
