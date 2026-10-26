"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
export default function StagingAdminActivation(){
 const [setupToken,setSetupToken]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[done,setDone]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setMessage("");
  try{const response=await fetch("/api/staging/admin-activate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({setupToken}),cache:"no-store"});
   const result=await response.json();if(!response.ok)throw Error(result.error||"Activation unavailable");
   setDone(true);setMessage("Staging Admin activated. Sign out, then sign in using Admin Login.");
  }catch(e){setMessage(e instanceof Error?e.message:"Activation unavailable")}finally{setBusy(false);setSetupToken("")}
 }
 return <main className="auth-shell"><section className="auth-card">
  <p className="eyebrow">UK Recovery — Isolated Staging only</p><h1>One-time Admin activation</h1>
  <p>Sign in first using the existing, email-verified Staging account. A separately approved database activation procedure and secure setup authorization are required. No public Admin registration is available.</p>
  {done?<Link href="/login?role=admin">Admin Login</Link>:<form onSubmit={submit}>
   <label>One-time setup authorization<input required type="password" autoComplete="off" value={setupToken} onChange={e=>setSetupToken(e.target.value)} minLength={32} maxLength={256}/></label>
   <button type="submit" disabled={busy}>{busy?"Checking…":"Activate Staging Admin"}</button>
  </form>}
  <p role="status">{message}</p><Link href="/login?role=customer">Sign in with existing account first</Link>
 </section></main>;
}
