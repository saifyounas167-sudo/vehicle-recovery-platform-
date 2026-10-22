// Runs before next build. Never print credential values.
const required=["NEXT_PUBLIC_SUPABASE_URL"];
const keyPresent=Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
const missing=required.filter(name=>!process.env[name]?.trim());
if(!keyPresent)missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
if(process.env.VERCEL_ENV==="preview"&&missing.length){
 console.error("[Preview build] Missing public Supabase environment variable names: "+missing.join(", "));
 process.exitCode=1;
}else if(missing.length){
 console.log("[Build] Public Supabase config unavailable (names only): "+missing.join(", "));
}
