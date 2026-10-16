"use client";
import Link from "next/link";
import {FormEvent,useState} from "react";
import {useSearchParams} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import "./login.css";
const destination={driver:"/driver",customer:"/customer",admin:"/admin"} as const;
type Role=keyof typeof destination;
function Icon({name}:{name:"email"|"lock"|"shield"}){return <span aria-hidden="true" className="premium-login-icon">{name==="email"?"✉":name==="lock"?"◈":"◆"}</span>}
export default function LoginForm(){
 const params=useSearchParams(),asked=params.get("role");
 const role:Role=asked==="driver"||asked==="business"?"driver":asked==="admin"?"admin":"customer";
 const mode=params.get("mode");
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const [showPassword,setShowPassword]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError("");setNotice("");
 try{
  const supabase=createClient();
  if(mode==="forgot"){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/login?role="+role+"&mode=recovery"});if(error)throw error;setNotice("If this email has an account, a password reset link will arrive shortly.");return;}
  if(mode==="recovery"){if(password.length<10)throw Error("Use at least 10 characters.");const {error}=await supabase.auth.updateUser({password});if(error)throw error;setNotice("Password updated. You can now sign in.");return;}
  if(mode==="signup"){setError("Customer public signup is not enabled during client review. Please contact support.");return;}
  const {data,error:loginError}=await supabase.auth.signInWithPassword({email,password});if(loginError)throw loginError;
  if(!data.user)throw Error("Unable to verify your session.");
  const {data:profile,error:profileError}=await supabase.from("profiles").select("role").eq("id",data.user.id).maybeSingle();if(profileError)throw profileError;
  if(!profile||profile.role!==role){window.location.assign("/403");return;}
  const next=params.get("next");
  const safeNext=next&&next.startsWith("/")&&!next.startsWith("//")&&!next.includes("\\")&&(next===destination[role]||next.startsWith(destination[role]+"/"))?next:destination[role];
  window.location.assign(safeNext);
 }catch(e){setError(e instanceof Error?e.message:"Authentication unavailable");}finally{setBusy(false)}
 }
 const heading=mode==="forgot"?"Forgot Password":mode==="recovery"?"Choose New Password":mode==="signup"?"Create Customer Account":role==="driver"?"Driver Login":role==="admin"?"Admin Login":"Customer Login";
 return <section className="premium-login-card" aria-labelledby="premium-login-heading"><div className="premium-login-brand"><span className="premium-login-mark">╱</span> UK <strong>RECOVERY</strong></div>
  <div className="premium-login-role"><Icon name="shield"/>{role.toUpperCase()} PORTAL</div>
  <h1 id="premium-login-heading">{heading}</h1>
  <p className="premium-login-intro">{mode==="forgot"?"Enter your account email to receive a secure reset link.":mode==="recovery"?"Set a strong new password for your account.":mode==="signup"?"New customer registration is not currently available.":"Welcome back. Sign in to your secure dashboard."}</p>
  {params.get("reason")==="auth"&&<p className="premium-login-notice">Please sign in to continue.</p>}
  {error&&<p className="premium-login-error" role="alert">{error}</p>}
  {notice&&<p className="premium-login-notice" role="status">{notice}</p>}
  {mode==="signup"?<Link className="premium-login-submit" href="/login?role=customer">Back to Sign In</Link>:
  <form onSubmit={submit} className="premium-login-form">
   {mode!=="recovery"&&<label>Email Address<div className="premium-login-field"><Icon name="email"/><input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></div></label>}
   {mode!=="forgot"&&<label>{mode==="recovery"?"New Password":"Password"}<div className="premium-login-field"><Icon name="lock"/><input type={showPassword?"text":"password"} required minLength={mode==="recovery"?10:undefined} autoComplete={mode==="recovery"?"new-password":"current-password"} placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="premium-login-reveal" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?"Hide":"Show"}</button></div></label>}
   {mode!=="forgot"&&mode!=="recovery"&&<Link className="premium-login-forgot" href={"/login?role="+role+"&mode=forgot"}>Forgot Password?</Link>}
   <button className="premium-login-submit" disabled={busy}>{busy?"Please wait…":mode==="forgot"?"Send Reset Link":mode==="recovery"?"Update Password":"Sign In →"}</button>
  </form>}
  {!mode&&<><div className="premium-login-divider"><span>Secure account access</span></div>
   <p className="premium-login-oauth-note">Google Sign In is unavailable until the provider and allowed callback URLs are verified.</p>
   {role!=="admin"&&<p className="premium-login-footer">New here? <Link href={role==="driver"?"/driver/register":"/login?role=customer&mode=signup"}>{role==="driver"?"Create Driver Account":"Create Account"}</Link></p>}
  </>}
  {mode&&mode!=="signup"&&<p className="premium-login-footer"><Link href={"/login?role="+role}>Back to Sign In</Link></p>}
  <p className="premium-login-safety">Role-based access protected by Supabase Auth. Marketplace transactions remain paused.</p>
 </section>;
}
