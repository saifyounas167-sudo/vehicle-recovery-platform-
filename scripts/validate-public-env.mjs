// Build-time public Supabase configuration preflight.
// Never output URLs, keys, hashes or secret values.
const names=["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const present=name=>typeof process.env[name]==="string"&&process.env[name].trim().length>0;
const missing=[];
if(!present(names[0]))missing.push(names[0]);
if(!present(names[1])&&!present(names[2]))missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
const isVercel=process.env.VERCEL==="1"||Boolean(process.env.VERCEL_ENV);
if(missing.length&&isVercel){
 console.error("[Supabase build preflight] Missing effective BUILD-TIME public environment variable names: "+missing.join(", "));
 console.error("[Supabase build preflight] Check this exact Git branch's Preview overrides; a General Preview variable does not prove it reached this deployment build.");
 console.error("[Supabase build preflight] Build halted to prevent deploying a broken Auth client. No credentials printed.");
 process.exitCode=1;
}else if(missing.length){
 console.log("[Local build] Public Supabase configuration unavailable (names only): "+missing.join(", "));
}
