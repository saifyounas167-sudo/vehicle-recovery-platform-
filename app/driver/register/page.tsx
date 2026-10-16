"use client";
import Link from "next/link";
import {useState,type FormEvent} from "react";
import {createClient} from "@/lib/supabase/client";
import {recoveryServices} from "@/src/lib/recovery-service-rules";
import DriverDocuments from "./driver-documents";
import "./registration.css";
const capabilities=["Car","Van","Motorbike","4x4","Other"];
const truckTypes=["Flatbed","Wheel-lift","Spec-lift","Heavy recovery","Motorbike recovery","Other"];
export default function DriverRegisterPage(){
 const [step,setStep]=useState(1),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[fullName,setFullName]=useState(""),[phone,setPhone]=useState(""),[companyName,setCompanyName]=useState(""),[truckType,setTruckType]=useState(""),[about,setAbout]=useState(""),[postcode,setPostcode]=useState(""),[radius,setRadius]=useState("25"),[services,setServices]=useState<string[]>([]),[vehicles,setVehicles]=useState<string[]>([]),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false);
 const toggle=(v:string,list:string[],setter:(a:string[])=>void)=>setter(list.includes(v)?list.filter(x=>x!==v):[...list,v]);
 function goNext(e:FormEvent){e.preventDefault();setMessage("");if(step===1){if(!/^(?:\+447\d{9}|07\d{9})$/.test(phone.replace(/[\s-]/g,""))){setMessage("Please enter a valid UK mobile number.");return;}setStep(2);}else if(step===2){if(!truckType||!services.length||!vehicles.length){setMessage("Select a recovery truck, service and supported vehicle.");return;}setStep(3);}}
 async function submit(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setMessage("");
 try{
  const review=await fetch("/api/client-review-status",{cache:"no-store"}).then(r=>r.json());
  if(review.clientDemo!==false||review.writesEnabled!==true)throw Error("Driver registration is paused during client review. No account has been created.");
  const supabase=createClient();
  let {data:{user}}=await supabase.auth.getUser();
  if(!user){
   if(!email||password.length<10)throw Error("Enter a valid email and password of at least 10 characters.");
   const signup=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/login?role=driver&next=/driver/register"}});
   if(signup.error)throw signup.error;
   if(!signup.data.session){setMessage("Check your email, verify your account, then sign in and return here to complete your application. No application has been submitted yet.");return;}
   user=signup.data.user;
  }
  if(!user?.email_confirmed_at)throw Error("Please verify your email before submitting your driver application.");
  const response=await fetch("/api/driver/apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName,phone,companyName,truckType,about,coveragePostcode:postcode,coverageRadiusMiles:Number(radius),services,vehicleCapabilities:vehicles})});
  const result=await response.json();if(!response.ok)throw Error(result.error||"Driver application unavailable");
  setSaved(true);setStep(4);setMessage("Application received. Your account is pending admin review; jobs are unavailable until approved and eligible.");
 }catch(error){setMessage(error instanceof Error?error.message:"Application unavailable");}
 finally{setBusy(false)}
 }
 return <main className="ss8-page"><section className="ss8-shell" aria-labelledby="ss8-title">
 <div className="ss8-head"><span>UK <strong>RECOVERY</strong></span><p>DRIVER REGISTRATION</p></div>
 <div className="ss8-body"><h1 id="ss8-title">Join as a Recovery Driver</h1><p className="ss8-lead">Create your account and start receiving recovery jobs in your area after verification and eligibility checks.</p>
 <div className="ss8-progress" aria-label="Registration progress"> {[1,2,3].map(n=><span key={n} className={step===n?"current":step>n?"complete":""}>{n===1?"Account":n===2?"Vehicle & services":"Coverage"}</span>)}</div>
 {step===1?<form className="ss8-form" onSubmit={goNext}>
  <label>Full Name<input required autoComplete="name" maxLength={120} minLength={2} placeholder="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)}/></label>
  <label>Email Address<input required type="email" autoComplete="email" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)}/></label>
  <label>Phone Number<input required type="tel" autoComplete="tel" placeholder="UK Phone Number" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
  <label>Vehicle Type<select required value={truckType} onChange={e=>setTruckType(e.target.value)}><option value="">Select vehicle type</option>{truckTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
  <label>Company Name (optional)<input maxLength={120} placeholder="Company Name (optional)" value={companyName} onChange={e=>setCompanyName(e.target.value)}/></label>
  <label>Password<input type="password" autoComplete="new-password" minLength={10} placeholder="At least 10 characters (new accounts)" value={password} onChange={e=>setPassword(e.target.value)}/></label>
  <button className="ss8-primary" type="submit">Continue →</button>
 </form>:step===2?<form className="ss8-form" onSubmit={goNext}>
  <h2>Recovery business details</h2>
  <label>Recovery truck type<select required value={truckType} onChange={e=>setTruckType(e.target.value)}>{truckTypes.map(t=><option key={t}>{t}</option>)}</select></label>
  <fieldset className="ss8-options"><legend>Services you provide</legend>{recoveryServices.map(s=><label key={s}><input type="checkbox" checked={services.includes(s)} onChange={()=>toggle(s,services,setServices)}/>{s}</label>)}</fieldset>
  <fieldset className="ss8-options"><legend>Vehicles you can recover</legend>{capabilities.map(v=><label key={v}><input type="checkbox" checked={vehicles.includes(v)} onChange={()=>toggle(v,vehicles,setVehicles)}/>{v}</label>)}</fieldset>
  <label>About your company (optional)<textarea maxLength={1200} value={about} onChange={e=>setAbout(e.target.value)}/></label>
  <div className="ss8-controls"><button type="button" onClick={()=>setStep(1)}>Back</button><button className="ss8-primary" type="submit">Continue →</button></div>
 </form>:step===3?<form className="ss8-form" onSubmit={submit}>
  <h2>Coverage & verification</h2>
  <label>UK coverage postcode<input required placeholder="M1 1AA" value={postcode} onChange={e=>setPostcode(e.target.value.toUpperCase())}/></label>
  <label>Coverage radius (miles)<input required type="number" min="1" max="300" value={radius} onChange={e=>setRadius(e.target.value)}/></label>
  <p className="ss8-notice">Email verification and admin approval are required. You will remain Pending and Offline until checked. Insurance and identity documents are uploaded privately after your application is saved.</p>
  <div className="ss8-controls"><button type="button" onClick={()=>setStep(2)} disabled={busy}>Back</button><button className="ss8-primary" type="submit" disabled={busy}>{busy?"Submitting…":"Submit for Admin Review"}</button></div>
 </form>:<div className="ss8-confirmed"><h2>Application Pending Review</h2><p>Registration does not grant access to recovery jobs. Complete private document uploads below and wait for admin approval.</p>{saved&&<DriverDocuments/>}</div>}
 <p className="ss8-status" role="status">{message}</p>
 {step===1&&<p className="ss8-login">Already have an account? <Link href="/login?role=driver&next=/driver/register">Login</Link></p>}
 </div></section></main>;
}
