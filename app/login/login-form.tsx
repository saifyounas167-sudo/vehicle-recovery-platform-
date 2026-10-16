"use client";
import {FormEvent,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {useSearchParams} from "next/navigation";
const destinations={driver:"/driver",customer:"/customer",admin:"/admin"} as const;
type Role=keyof typeof destinations;
export default function LoginForm(){
 const params=useSearchParams(),queryRole=params.get("role");
 const role:Role=queryRole==="driver"||queryRole==="business"?"driver":queryRole==="admin"?"admin":"customer";
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setError("");
  try{
   const supabase=createClient();
   const {data,error:loginError}=await supabase.auth.signInWithPassword({email,password});
   if(loginError)throw loginError;
   if(!data.user)throw Error("Unable to verify your session.");
   const {data:profile,error:profileError}=await supabase.from("profiles").select("role").eq("id",data.user.id).maybeSingle();
   if(profileError)throw profileError;
   if(!profile||profile.role!==role){window.location.assign("/403");return;}
   const next=params.get("next");
   const safeNext=next&&next.startsWith("/")&&!next.startsWith("//")&&!next.includes("\\")&&
    (next===destinations[role]||next.startsWith(destinations[role]+"/"))?next:destinations[role];
   window.location.assign(safeNext);
  }catch(e){setError(e instanceof Error?e.message:"Sign-in unavailable");setBusy(false);}
 }
 return <section className="auth-card"><div className="eyebrow">UK Recovery · {role} login</div>
  <h1>{role==="driver"?"Driver Login":role==="admin"?"Admin Login":"Customer Login"}</h1>
  <p>Sign in to access your protected dashboard.</p>
  {params.get("reason")==="auth"&&<div className="alert">Please sign in to continue.</div>}
  {error&&<div className="alert error" role="alert">{error}</div>}
  <form className="form-grid" onSubmit={submit}>
   <label>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
   <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <button className="button primary button-large" disabled={busy}>{busy?"Signing in…":"Sign in →"}</button>
  </form><p className="auth-note">Your account role is verified against Supabase. Marketplace actions remain paused during client review.</p>
 </section>;
}