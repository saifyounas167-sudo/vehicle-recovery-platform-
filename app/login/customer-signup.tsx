"use client";
import Link from "next/link";
import {FormEvent,useState} from "react";
import {createClient} from "@/lib/supabase/client";
const UK_PHONE=/^(?:\+44\s?\d{9,10}|0\d{10})$/;
export default function CustomerSignup(){
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[phone,setPhone]=useState("");
 const [password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[show,setShow]=useState(false);
 const [agreed,setAgreed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[sent,setSent]=useState(false);
 async function submit(e:FormEvent){
  e.preventDefault();if(busy)return;setError("");
  if(name.trim().length<2||name.trim().length>100){setError("Enter your full name (2–100 characters).");return}
  if(phone.trim()&&!UK_PHONE.test(phone.replace(/[()\-]/g,"").trim())){setError("Enter a valid UK phone number or leave it blank.");return}
  if(password.length<6){setError("Password must have at least 6 characters.");return}
  if(password!==confirm){setError("Passwords do not match.");return}
  if(!agreed){setError("Accept the Terms and Privacy Policy to continue.");return}
  setBusy(true);
  try{
   const client=createClient();
   const result=await client.auth.signUp({
    email:email.trim().toLowerCase(),password,
    options:{emailRedirectTo:window.location.origin+"/auth/confirm?type=signup",
      data:{registration_flow:"customer_public_v1",full_name:name.trim(),phone:phone.trim()||null}}
   });
   if(result.error)throw result.error;
   // A secure database trigger assigns 'customer'; the browser cannot set role.
   if(result.data.session){
    const {data:profile}=await client.from("profiles").select("role").eq("id",result.data.user?.id??"").maybeSingle();
    if(profile?.role==="customer"){window.location.assign("/customer");return;}
    await client.auth.signOut({scope:"local"});
   }
   setSent(true);
  }catch(e){
   const m=e instanceof Error?e.message:"Registration unavailable.";
   setError(/already registered|already exists|user already/i.test(m)?"If this email is already registered, sign in or reset your password.":m);
  }finally{setBusy(false)}
 }
 if(sent)return <section className="premium-login-card" aria-live="polite"><div className="premium-login-role">UK RECOVERY · CUSTOMER</div><h1>Check your email</h1><p className="premium-login-intro">If the address is eligible, a verification email will arrive shortly. Open its secure link to finish registration.</p><p className="premium-login-safety">Check spam or junk mail if needed.</p><Link className="premium-login-submit" href="/login?role=customer">Back to Sign In</Link></section>;
 return <section className="premium-login-card" aria-labelledby="customer-signup-title">
  <div className="premium-login-brand">UK <strong>RECOVERY</strong></div>
  <div className="premium-login-role">CUSTOMER PORTAL</div><h1 id="customer-signup-title">Create your account</h1>
  <p className="premium-login-intro">Your recovery account, ready whenever you need it.</p>
  {error&&<p role="alert" className="premium-login-error">{error}</p>}
  <form className="premium-login-form" onSubmit={submit}>
   <label>Full Name<div className="premium-login-field"><input autoComplete="name" required maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="Full name"/></div></label>
   <label>Email Address<div className="premium-login-field"><input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
   <label>UK Phone Number (optional)<div className="premium-login-field"><input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07123 456789"/></div></label>
   <label>Password<div className="premium-login-field"><input type={show?"text":"password"} autoComplete="new-password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a strong password"/></div></label>
   <label>Confirm Password<div className="premium-login-field"><input type={show?"text":"password"} autoComplete="new-password" required minLength={6} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password"/></div></label>
   <label className="customer-signup-checkbox"><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/> Show passwords</label>
   <p className="premium-login-safety">Use 6 or more characters. Any mix of letters, numbers or symbols is allowed. A longer password is safer.</p>
   <label className="customer-signup-checkbox"><input type="checkbox" checked={agreed} required onChange={e=>setAgreed(e.target.checked)}/> I agree to the <Link href="/terms" target="_blank">Terms</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>.</label>
   <button className="premium-login-submit" disabled={busy} type="submit">{busy?"Creating account…":"Create Account"}</button>
  </form>
  <p className="premium-login-footer">Already have an account? <Link href="/login?role=customer">Sign In</Link></p>
 </section>
}
