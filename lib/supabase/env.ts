export function getSupabaseEnv(){
 // Server-side Supabase Auth read access is allowed for role-verified dashboards.
 // Marketplace writes remain blocked independently by proxy.ts and API guards.
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return null;
 return {url,key};
}
