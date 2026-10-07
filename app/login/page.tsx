"use client";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

export default function LoginPage(){
 const params=useSearchParams(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");const supabase=createClient();const {error}=await supabase.auth.signInWithPassword({email,password});if(error){setError(error.message);setBusy(false);return;}window.location.href="/"; }
 return <main className="auth-shell"><section className="auth-card"><div className="eyebrow">UK Recovery account</div><h1>Welcome back.</h1><p>Sign in to access the part of the marketplace assigned to your account.</p>{params.get("reason")==="auth"&&<div className="alert">Please sign in to continue.</div>}{params.get("reason")==="role"&&<div className="alert">Your account does not have access to that area.</div>}{error&&<div className="alert error">{error}</div>}<form className="form-grid" onSubmit={submit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label><button className="button primary button-large" disabled={busy}>{busy?"Signing in…":"Sign in →"}</button></form><p className="auth-note">Need an account? Customer sign-up can be added to the same Supabase authentication flow without changing marketplace permissions.</p></section></main>;
}
