"use client";
import Link from "next/link";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {createClient} from "@/lib/supabase/client";
import {recoveryServices} from "@/src/lib/recovery-service-rules";
import DriverDocuments from "./driver-documents";
import "./registration.css";

const truckTypes=["Flatbed","Wheel-lift","Spec-lift","Heavy Recovery","Motorbike Recovery","Other"];
const postcodePattern=/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;
const phonePattern=/^(?:\+447\d{9}|07\d{9})$/;
const DRAFT_KEY="uk-recovery-driver-application-draft-v1";
type Draft={fullName:string;email:string;phone:string;companyName:string;truckType:string;businessAddress:string;companyRegistrationNumber:string;recoveryExperience:string;truckDetails:string;vehicleRegistration:string;operatingAreas:string;postcode:string;radius:string;services:string[]};
const empty:Draft={fullName:"",email:"",phone:"",companyName:"",truckType:"",businessAddress:"",companyRegistrationNumber:"",recoveryExperience:"",truckDetails:"",vehicleRegistration:"",operatingAreas:"",postcode:"",radius:"25",services:[]};

export default function DriverRegisterPage(){
 const [draft,setDraft]=useState<Draft>(empty),[password,setPassword]=useState(""),[showPassword,setShowPassword]=useState(false);
 const [step,setStep]=useState(1),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false),[agree,setAgree]=useState(false),[hydrated,setHydrated]=useState(false);
 const firstField=useRef<HTMLDivElement>(null),inFlight=useRef(false);
 const change=(name:keyof Draft,value:string)=>setDraft(d=>({...d,[name]:value}));
 const toggle=(value:string)=>setDraft(d=>({...d,services:d.services.includes(value)?d.services.filter(s=>s!==value):[...d.services,value]}));
 useEffect(()=>{
  try{
   const json=sessionStorage.getItem(DRAFT_KEY);
   if(json){const value=JSON.parse(json) as Partial<Draft>;setDraft({...empty,...value,services:Array.isArray(value.services)?value.services.filter(v=>recoveryServices.includes(v as typeof recoveryServices[number])):[]});}
  }catch{/* Browser storage is optional; no credentials are persisted. */}
  setHydrated(true);
 },[]);
 useEffect(()=>{
  if(!hydrated||saved)return;
  try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(draft));}catch{/* Safe fallback: current in-memory state remains. */}
 },[draft,hydrated,saved]);
 function validationError(stage:number):string|null{
  if(stage===1){
   if(draft.fullName.trim().length<2)return "Enter your full name (at least 2 characters).";
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))return "Enter a valid email address.";
   if(!phonePattern.test(draft.phone.replace(/[\s-]/g,"")))return "Enter a UK mobile number, e.g. 07123 456789 or +447123456789.";
   if(password.length<10)return "Password must contain at least 10 characters. Existing drivers can sign in below.";
  }
  if(stage===2){
   if(!draft.truckType)return "Select your recovery truck type.";
   if(!draft.services.length)return "Choose at least one recovery service.";
   if(!draft.businessAddress.trim())return "Enter your business address.";
  }
  if(stage===3){
   if(!postcodePattern.test(draft.postcode.trim()))return "Enter a valid UK coverage postcode, e.g. M1 1AA.";
   const areas=draft.operatingAreas.split(",").map(x=>x.trim()).filter(Boolean);
   if(!areas.length)return "Enter at least one operating area, e.g. Manchester.";
   if(areas.length>30||areas.some(x=>x.length>100))return "Enter up to 30 areas, maximum 100 characters each.";
   if(!Number.isInteger(Number(draft.radius))||Number(draft.radius)<1||Number(draft.radius)>300)return "Choose a radius between 1 and 300 miles.";
  }
  if(stage===4&&!agree)return "Confirm that your information is accurate and you accept the applicable terms.";
  return null;
 }
 function focusError(){
  window.requestAnimationFrame(()=>firstField.current?.querySelector<HTMLElement>("input,select,textarea")?.focus());
 }
 function goNext(e:FormEvent){e.preventDefault();setMessage("");
  const error=validationError(step);if(error){setMessage(error);focusError();return;}
  setStep(s=>Math.min(4,s+1));window.scrollTo({top:0,behavior:"smooth"});
 }
 function goBack(){setMessage("");setStep(s=>Math.max(1,s-1));window.scrollTo({top:0,behavior:"smooth"});}
 async function submit(e:FormEvent){
  e.preventDefault();if(inFlight.current||saved)return;
  const error=[1,2,3,4].map(validationError).find(Boolean);
  if(error){setMessage(error);return;}
  inFlight.current=true;setBusy(true);setMessage("");
  try{
   const review=await fetch("/api/driver/registration-status",{cache:"no-store"}).then(r=>r.json());
   if(review.registrationEnabled!==true)throw Error("Driver registration is currently unavailable. No application was submitted.");
   const supabase=createClient();
   let {data:{user}}=await supabase.auth.getUser();
   if(!user){
    const signup=await supabase.auth.signUp({email:draft.email.trim(),password,options:{emailRedirectTo:window.location.origin+"/login?role=driver&next=/driver/register",data:{registration_flow:"driver_application_v1",full_name:draft.fullName.trim()}}});
    if(signup.error)throw signup.error;
    if(!signup.data.session){
     setPassword("");setStep(1);
     setMessage("Check your email and verify your account. Then sign in on this same Preview to finish your saved application. Nothing has been submitted yet.");
     return;
    }
    user=signup.data.user;
   }
   if(!user)throw Error("Unable to verify your account. Please sign in and try again.");
   const response=await fetch("/api/driver/apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    fullName:draft.fullName.trim(),phone:draft.phone,companyName:draft.companyName,truckType:draft.truckType,
    businessAddress:draft.businessAddress,companyRegistrationNumber:draft.companyRegistrationNumber,
    recoveryExperience:draft.recoveryExperience,recoveryTruckDetails:draft.truckDetails,vehicleRegistrationDetails:draft.vehicleRegistration,
    operatingAreas:draft.operatingAreas.split(",").map(x=>x.trim()).filter(Boolean),
    coveragePostcode:draft.postcode.trim().toUpperCase(),coverageRadiusMiles:Number(draft.radius),services:draft.services
   })});
   const result=await response.json();if(!response.ok)throw Error(result.error||"Driver application unavailable.");
   // Only show success after the backend confirms the database write.
   setSaved(true);setPassword("");try{sessionStorage.removeItem(DRAFT_KEY);}catch{}
   setMessage("Application Submitted Successfully. Your application is pending Admin approval.");
  }catch(error){
   const detail=error instanceof Error?error.message:"Application unavailable.";
   setMessage(/already registered|already exists/i.test(detail)?"If you already have an account, please Sign In to continue.":detail);
  }finally{inFlight.current=false;setBusy(false);}
 }
 const d=draft;
 return <main className="ss8-page"><section className="ss8-shell" aria-labelledby="ss8-title">
  <div className="ss8-head"><span>UK <strong>RECOVERY</strong></span><p>DRIVER REGISTRATION</p></div>
  <div className="ss8-body">
   <h1 id="ss8-title">Join as a Recovery Driver</h1>
   <p className="ss8-lead">Four simple steps to apply. Your application stays Pending and Offline until Admin approval.</p>
   <div className="ss8-progress" aria-label="Registration progress">{["Account","Business & truck","Coverage","Review & documents"].map((label,i)=><span key={label} className={step===i+1?"current":step>i+1?"complete":""} aria-current={step===i+1?"step":undefined}><b>{i+1}</b><small>{label}</small></span>)}</div>
   {!hydrated?<p role="status">Loading your saved details…</p>:<>
   {step===1&&!saved?<form className="ss8-form" onSubmit={goNext} noValidate>
    <div ref={firstField} className="ss8-fields">
     <label>Full Name <em>Required</em><input required autoComplete="name" minLength={2} maxLength={120} value={d.fullName} placeholder="Your full name" onChange={e=>change("fullName",e.target.value)}/></label>
     <label>Email Address <em>Required</em><input required type="email" autoComplete="email" value={d.email} placeholder="you@example.co.uk" onChange={e=>change("email",e.target.value)}/></label>
     <label>UK Phone Number <em>Required</em><input required type="tel" autoComplete="tel" inputMode="tel" value={d.phone} placeholder="07123 456789" onChange={e=>change("phone",e.target.value)}/></label>
     <label>Password <em>Required for new accounts</em><span className="ss8-password"><input required type={showPassword?"text":"password"} autoComplete="new-password" minLength={10} value={password} placeholder="At least 10 characters" onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={showPassword?"Hide password":"Show password"} aria-pressed={showPassword} onClick={()=>setShowPassword(v=>!v)}>{showPassword?"Hide":"Show"}</button></span></label>
    </div>
    <p className="ss8-help">Already registered? <Link href="/login?role=driver&next=/driver/register">Sign In</Link> — your saved details will remain on this Preview.</p>
    <button className="ss8-primary" type="submit">Continue →</button>
   </form>:null}
   {step===2&&!saved?<form className="ss8-form" onSubmit={goNext} noValidate>
    <h2>Business & recovery vehicle</h2>
    <div ref={firstField} className="ss8-fields">
     <label>Company Name <em>Optional</em><input maxLength={120} value={d.companyName} onChange={e=>change("companyName",e.target.value)} placeholder="Your recovery company"/></label>
     <label>Recovery Truck Type <em>Required</em><select required value={d.truckType} onChange={e=>change("truckType",e.target.value)}><option value="">Choose a truck type</option>{truckTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
     <fieldset className="ss8-options"><legend>Services Provided <em>Required</em></legend>{recoveryServices.map(s=><label key={s}><input type="checkbox" checked={d.services.includes(s)} onChange={()=>toggle(s)}/><span>{s}</span></label>)}</fieldset>
     <label>Business Address <em>Required</em><input required maxLength={400} value={d.businessAddress} onChange={e=>change("businessAddress",e.target.value)} placeholder="Street, town and postcode"/></label>
     <label>Recovery Experience (years) <em>Optional</em><input type="number" min="0" max="80" value={d.recoveryExperience} onChange={e=>change("recoveryExperience",e.target.value)} placeholder="e.g. 5"/></label>
     <label>Company Registration Number <em>Optional</em><input maxLength={120} value={d.companyRegistrationNumber} onChange={e=>change("companyRegistrationNumber",e.target.value)}/></label>
     <label>Recovery Truck Details <em>Optional</em><textarea maxLength={1000} value={d.truckDetails} onChange={e=>change("truckDetails",e.target.value)} placeholder="Capacity, equipment and vehicle notes"/></label>
     <label>Vehicle Registration Details <em>Optional</em><input maxLength={150} value={d.vehicleRegistration} onChange={e=>change("vehicleRegistration",e.target.value)}/></label>
    </div>
    <div className="ss8-controls"><button type="button" onClick={goBack}>← Back</button><button className="ss8-primary" type="submit">Continue →</button></div>
   </form>:null}
   {step===3&&!saved?<form className="ss8-form" onSubmit={goNext} noValidate>
    <h2>Coverage area</h2>
    <div ref={firstField} className="ss8-fields">
     <label>UK Coverage Postcode <em>Required</em><input required autoComplete="postal-code" value={d.postcode} onChange={e=>change("postcode",e.target.value.toUpperCase())} placeholder="M1 1AA"/><small>Enter the main postcode where your truck operates.</small></label>
     <label>Operating Areas <em>Required</em><input required value={d.operatingAreas} onChange={e=>change("operatingAreas",e.target.value)} placeholder="Manchester, Salford, Stockport"/><small>Separate towns or areas with commas.</small></label>
     <label>Coverage Radius (miles) <em>Required</em><input required type="number" min="1" max="300" step="1" value={d.radius} onChange={e=>change("radius",e.target.value)}/><small>Between 1 and 300 miles from your verified postcode.</small></label>
    </div>
    <p className="ss8-notice">We verify your UK postcode and calculate coverage coordinates securely when the application is submitted.</p>
    <div className="ss8-controls"><button type="button" onClick={goBack}>← Back</button><button className="ss8-primary" type="submit">Continue →</button></div>
   </form>:null}
   {step===4?<section className="ss8-review">
    {!saved?<><h2>Review & submit</h2><p className="ss8-help">Check your details before applying. Private document upload becomes available immediately after your application is saved.</p>
     <dl className="ss8-summary"><div><dt>Driver</dt><dd>{d.fullName} · {d.email} · {d.phone}</dd></div><div><dt>Business & truck</dt><dd>{d.companyName||"Independent driver"} · {d.truckType}</dd></div><div><dt>Services</dt><dd>{d.services.join(", ")}</dd></div><div><dt>Business address</dt><dd>{d.businessAddress}</dd></div><div><dt>Coverage</dt><dd>{d.postcode} · {d.radius} miles · {d.operatingAreas}</dd></div></dl>
     <p className="ss8-notice">Insurance certificate and valid ID are required before Admin approval. Recovery truck and driver profile photos are optional. Private uploads accept PDF, JPG or PNG up to 5 MB.</p>
     <form onSubmit={submit}><label className="ss8-agree"><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/><span>I confirm these details are accurate and agree to the applicable <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms</Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</span></label>
      <div className="ss8-controls"><button type="button" onClick={goBack} disabled={busy}>← Back</button><button className="ss8-primary" type="submit" disabled={busy||!agree}>{busy?"Submitting securely…":"Submit for Admin Review"}</button></div>
     </form></>:<div className="ss8-confirmed"><h2>Application Submitted Successfully</h2><p>Your application is pending Admin approval. Your driver account remains Pending and Offline. Upload required private documents below.</p><DriverDocuments/><p className="ss8-login"><Link href="/driver">Open Driver Dashboard →</Link></p></div>}
    </section>:null}
   </>}
   {message&&<p className="ss8-status" role="alert">{message}</p>}
  </div>
 </section></main>;
}
