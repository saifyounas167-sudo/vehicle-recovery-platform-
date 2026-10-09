import {isClientReviewDemo} from "@/src/lib/client-review";
export function getSupabaseEnv(){
 // Demo never uses server-side Supabase, even if test credentials are configured.
 if(isClientReviewDemo())return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return null;
 return {url,key};
}
