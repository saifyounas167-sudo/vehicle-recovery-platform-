"use client";
import Link from "next/link";
import {FormEvent,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import "./login.css";
import CustomerSignup from "./customer-signup";
const destination={driver:"/driver",customer:"/customer",admin:"/admin"} as const;
type Role=keyof typeof destination;
function readableAuthError(error:unknown):string{
 const message=error instanceof Error?error.message:String(error??"");
 if(/failed to fetch|networkerror|network request failed|load failed/i.test(message)){
  return "Cannot connect to the authentication server. Check your internet connection, disable VPN/ad blockers temporarily, then try again. If it continues, contact support; your password has not been changed.";
 }
 return message||"Authentication is temporarily unavailable. Please try again.";
}
function Icon({name}:{name:"email"|"lock"|"shield"}){return <span aria-hidden="true" className="premium-login-icon">{name==="email"?"✉":name==="lock"?"◈":"◆"}</span>}
export default function LoginForm(){
 const params=useSearchParams(),asked=params.get("role");
 const role:Role=asked==="driver"||asked==="business"?"driver":asked==="admin"?"admin":"customer";
 const mode=params.get("mode");
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const [showPassword,setShowPassword]=useState(false);
 const [googleEnabled,setGoogleEnabled]=useState(false);
 const [recoveryReady,setRecoveryReady]=useState(false);
 useEffect(()=>{if(mode!=="recovery")return;createClient().auth.getSession().then(({data})=>setRecoveryReady(Boolean(data.session))).catch(()=>setRecoveryReady(false))},[mode]);
 useEffect(()=>{let active=true;fetch("/api/auth/google-status",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(v=>{if(active)setGoogleEnabled(v?.enabled===true)}).catch(()=>{if(active)setGoogleEnabled(false)});return()=>{active=false}},[]);
 async function googleSignIn(){if(!googleEnabled||busy)return;setBusy(true);setError("");try{
  const supabase=createClient();
  const redirectTo=window.location.origin+"/auth/callback?role="+role;
  const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo,queryParams:{prompt:"select_account"}}});
  if(error)throw error;
 }catch(e){setError(readableAuthError(e));setBusy(false)}
 }
 async function submit(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError("");setNotice("");
 try{
  const supabase=createClient();
  if(mode==="forgot"){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/auth/confirm?type=recovery"});if(error)throw error;setNotice("If this email has an account, a password reset link will arrive shortly.");return;}
  if(mode==="recovery"){if(!recoveryReady)throw Error("Open a valid password reset email link first.");if(password.length<10)throw Error("Use at least 10 characters.");const {error}=await supabase.auth.updateUser({password});if(error)throw error;await supabase.auth.signOut({scope:"local"});setNotice("Password updated. You can now sign in.");return;}

  const {data,error:loginError}=await supabase.auth.signInWithPassword({email,password});if(loginError)throw loginError;
  if(!data.user)throw Error("Unable to verify your session.");
  const {data:profile,error:profileError}=await supabase.from("profiles").select("role").eq("id",data.user.id).maybeSingle();if(profileError)throw profileError;
  if(!profile||profile.role!==role){await supabase.auth.signOut({scope:"local"});window.location.assign("/403");return;}
  const next=params.get("next");
  const safeNext=next&&next.startsWith("/")&&!next.startsWith("//")&&!next.includes("\\")&&(next===destination[role]||next.startsWith(destination[role]+"/"))?next:destination[role];
  window.location.assign(safeNext);
 }catch(e){setError(readableAuthError(e));}finally{setBusy(false)}
 }
 if(mode==="signup"&&role==="customer")return <CustomerSignup/>;
 const heading=mode==="forgot"?"Forgot Password":mode==="recovery"?"Choose New Password":mode==="signup"?"Create Customer Account":role==="driver"?"Driver Login":role==="admin"?"Admin Login":"Customer Login";
 return <section className="premium-login-card" aria-labelledby="premium-login-heading"><div className="premium-login-brand"><span className="premium-login-mark">╱</span> UK <strong>RECOVERY</strong></div>
  <div className="premium-login-role"><Icon name="shield"/>{role.toUpperCase()} PORTAL</div>
  <h1 id="premium-login-heading">{heading}</h1>
  <p className="premium-login-intro">{mode==="forgot"?"Enter your account email to receive a secure reset link.":mode==="recovery"?"Set a strong new password for your account.":"Welcome back. Sign in to your secure dashboard."}</p>
  {params.get("reason")==="auth"&&<p className="premium-login-notice">Please sign in to continue.</p>}
  {error&&<p className="premium-login-error" role="alert">{error}</p>}
  {notice&&<p className="premium-login-notice" role="status">{notice}</p>}
  <form onSubmit={submit} className="premium-login-form">
   {mode!=="recovery"&&<label>Email Address<div className="premium-login-field"><Icon name="email"/><input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></div></label>}
   {mode!=="forgot"&&<label>{mode==="recovery"?"New Password":"Password"}<div className="premium-login-field"><Icon name="lock"/><input type={showPassword?"text":"password"} required minLength={mode==="recovery"?10:undefined} autoComplete={mode==="recovery"?"new-password":"current-password"} placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="premium-login-reveal" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?"Hide":"Show"}</button></div></label>}
   {mode!=="forgot"&&mode!=="recovery"&&<Link className="premium-login-forgot" href={"/login?role="+role+"&mode=forgot"}>Forgot Password?</Link>}
   <button className="premium-login-submit" disabled={busy}>{busy?"Please wait…":mode==="forgot"?"Send Reset Link":mode==="recovery"?"Update Password":"Sign In →"}</button>
  </form>
  {!mode&&<><div className="premium-login-divider"><span>or continue with</span></div>
   <button type="button" className="premium-login-google" disabled={!googleEnabled||busy} onClick={()=>void googleSignIn()} aria-describedby="premium-google-unavailable"><svg className="premium-google-logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.86 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.77-4.59l-7.98-6.2A23.83 23.83 0 0 0 0 24c0 3.87.93 7.5 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Sign in with Google</button>
   <p id="premium-google-unavailable" className="premium-login-oauth-note">{googleEnabled?"Use your existing approved UK Recovery account. New Google users do not receive access automatically.":"Google login is disabled in Production. Available only in approved isolated staging."}</p>
   {role!=="admin"&&<p className="premium-login-footer">New here? <Link href={role==="driver"?"/driver/register":"/login?role=customer&mode=signup"}>{role==="driver"?"Create Driver Account":"Create Account"}</Link></p>}
  </>}
  {mode&&mode!=="signup"&&<p className="premium-login-footer"><Link href={"/login?role="+role}>Back to Sign In</Link></p>}
  <p className="premium-login-safety">Role-based access protected by Supabase Auth. Marketplace transactions remain paused.</p>
 </section>;
}
