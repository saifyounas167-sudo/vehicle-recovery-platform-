"use client";
import Link from "next/link";
import {useState,type FormEvent} from "react";
import {createClient} from "@/lib/supabase/client";
import {recoveryServices} from "@/src/lib/recovery-service-rules";
import DriverDocuments from "./driver-documents";
import "./registration.css";
const truckTypes=["Flatbed","Wheel-lift","Spec-lift","Heavy recovery","Motorbike recovery","Other"];
export default function DriverRegisterPage(){
 const [businessAddress,setBusinessAddress]=useState(""),[companyRegistrationNumber,setCompanyRegistrationNumber]=useState(""),[recoveryExperience,setRecoveryExperience]=useState(""),[truckDetails,setTruckDetails]=useState(""),[vehicleRegistration,setVehicleRegistration]=useState(""),[operatingAreas,setOperatingAreas]=useState("");
 const [step,setStep]=useState(1),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[fullName,setFullName]=useState(""),[phone,setPhone]=useState(""),[companyName,setCompanyName]=useState(""),[truckType,setTruckType]=useState(""),[about,setAbout]=useState(""),[postcode,setPostcode]=useState(""),[radius,setRadius]=useState("25"),[services,setServices]=useState<string[]>([]),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false);
 const toggle=(v:string,list:string[],setter:(a:string[])=>void)=>setter(list.includes(v)?list.filter(x=>x!==v):[...list,v]);
 function goNext(e:FormEvent){e.preventDefault();setMessage("");if(step===1){if(!/^(?:\+447\d{9}|07\d{9})$/.test(phone.replace(/[\s-]/g,""))){setMessage("Please enter a valid UK mobile number.");return;}setStep(2);}else if(step===2){if(!truckType||!services.length){setMessage("Select a recovery truck and service.");return;}setStep(3);}}
 async function submit(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setMessage("");
 try{
  const review=await fetch("/api/driver/registration-status",{cache:"no-store"}).then(r=>r.json());
  if(review.registrationEnabled!==true)throw Error("Driver registration is not enabled. No account has been created.");
  const supabase=createClient();
  let {data:{user}}=await supabase.auth.getUser();
  if(!user){
   if(!email||password.length<10)throw Error("Enter a valid email and password of at least 10 characters.");
   const signup=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/login?role=driver&next=/driver/register",data:{registration_flow:"driver_application_v1",full_name:fullName.trim()}}});
   if(signup.error)throw signup.error;
   if(!signup.data.session){setMessage("Check your email, verify your account, then sign in and return here to complete your application. No application has been submitted yet.");return;}
   user=signup.data.user;
  }
  // Supabase Auth settings determine whether email confirmation is required. A valid session is sufficient here.
  const response=await fetch("/api/driver/apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName,phone,companyName,truckType,businessAddress,companyRegistrationNumber,recoveryExperience,recoveryTruckDetails:truckDetails,vehicleRegistrationDetails:vehicleRegistration,operatingAreas:operatingAreas.split(",").map(x=>x.trim()).filter(Boolean),coveragePostcode:postcode,coverageRadiusMiles:Number(radius),services})});
  const result=await response.json();if(!response.ok)throw Error(result.error||"Driver application unavailable");
  setSaved(true);setStep(4);setMessage("Application saved as Pending Admin Approval. Upload your verification documents below before opening your Driver Dashboard.");
 }catch(error){setMessage(error instanceof Error?error.message:"Application unavailable");}
 finally{setBusy(false)}
 }
 return <main className="ss8-page"><section className="ss8-shell" aria-labelledby="ss8-title">
 <div className="ss8-head"><span>UK <strong>RECOVERY</strong></span><p>DRIVER REGISTRATION</p></div>
 <div className="ss8-body"><h1 id="ss8-title">Join as a Recovery Driver</h1><p className="ss8-lead">Create your account and start receiving recovery jobs in your area after verification and eligibility checks.</p>
 <div className="ss8-progress" aria-label="Registration progress"> {[1,2,3,4].map(n=><span key={n} className={step===n?"current":step>n?"complete":""}>{n===1?"Account":n===2?"Vehicle & services":n===3?"Coverage":"Documents"}</span>)}</div>
 {step===1?<form className="ss8-form" onSubmit={goNext}>
  <label>Full Name<input required autoComplete="name" maxLength={120} minLength={2} placeholder="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)}/></label>
  <label>Email Address<input required type="email" autoComplete="email" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)}/></label>
  <label>Phone Number<input required type="tel" autoComplete="tel" placeholder="UK Phone Number" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
  <label>Vehicle Type<select required value={truckType} onChange={e=>setTruckType(e.target.value)}><option value="">Select vehicle type</option>{truckTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
  <label>Company Name (optional)<input maxLength={120} placeholder="Company Name (optional)" value={companyName} onChange={e=>setCompanyName(e.target.value)}/></label>
  <button className="ss8-primary" type="submit">Continue →</button>
 </form>:step===2?<form className="ss8-form" onSubmit={goNext}>
  <h2>Recovery business details</h2>
  <label>Password<input type="password" autoComplete="new-password" minLength={10} placeholder="At least 10 characters (new accounts)" value={password} onChange={e=>setPassword(e.target.value)}/></label>
  <label>Recovery truck type<select required value={truckType} onChange={e=>setTruckType(e.target.value)}>{truckTypes.map(t=><option key={t}>{t}</option>)}</select></label>
  <fieldset className="ss8-options"><legend>Services you provide</legend>{recoveryServices.map(s=><label key={s}><input type="checkbox" checked={services.includes(s)} onChange={()=>toggle(s,services,setServices)}/>{s}</label>)}</fieldset>
  <label>Business Address<input maxLength={400} value={businessAddress} onChange={e=>setBusinessAddress(e.target.value)}/></label>
  <label>Company Registration Number (where applicable)<input maxLength={120} value={companyRegistrationNumber} onChange={e=>setCompanyRegistrationNumber(e.target.value)}/></label>
  <label>Recovery Experience (years)<input type="number" min="0" max="80" value={recoveryExperience} onChange={e=>setRecoveryExperience(e.target.value)}/></label>
  <label>Recovery Truck Details<textarea maxLength={1000} value={truckDetails} onChange={e=>setTruckDetails(e.target.value)}/></label>
  <label>Vehicle Registration Details<input maxLength={150} value={vehicleRegistration} onChange={e=>setVehicleRegistration(e.target.value)}/></label>
  <div className="ss8-controls"><button type="button" onClick={()=>setStep(1)}>Back</button><button className="ss8-primary" type="submit">Continue →</button></div>
 </form>:step===3?<form className="ss8-form" onSubmit={submit}>
  <h2>Coverage & verification</h2>
  <label>UK coverage postcode<input required placeholder="M1 1AA" value={postcode} onChange={e=>setPostcode(e.target.value.toUpperCase())}/></label>
  <label>Operating Areas (comma separated)<input value={operatingAreas} onChange={e=>setOperatingAreas(e.target.value)} placeholder="Manchester, Salford"/></label>
  <label>Coverage radius (miles)<input required type="number" min="1" max="300" value={radius} onChange={e=>setRadius(e.target.value)}/></label>
  <p className="ss8-notice">Admin approval is required. If email confirmation is enabled for your account, confirm your email before submitting. You will remain Pending and Offline until checked. Insurance and valid ID must be uploaded privately before admin approval. Driver profile picture and recovery truck photos can also be uploaded privately. When Supabase email confirmation is disabled, a valid authenticated session can submit immediately.</p>
  <div className="ss8-controls"><button type="button" onClick={()=>setStep(2)} disabled={busy}>Back</button><button className="ss8-primary" type="submit" disabled={busy}>{busy?"Submitting…":"Submit for Admin Review"}</button></div>
 </form>:<div className="ss8-confirmed"><h2>Application Pending Review</h2><p>Registration does not grant access to recovery jobs. Complete private document uploads below and wait for admin approval.</p>{saved&&<><DriverDocuments/><p className="ss8-login"><Link href="/driver" className="ss8-primary">Open Driver Dashboard →</Link></p></>}</div>}
 <p className="ss8-status" role="status">{message}</p>
 {step===1&&<p className="ss8-login">Already have an account? <Link href="/login?role=driver&next=/driver/register">Login</Link></p>}
 </div></section></main>;
}
