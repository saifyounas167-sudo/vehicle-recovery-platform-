"use client";
import Link from "next/link";
import {useState,type FormEvent} from "react";
import {createClient} from "@/lib/supabase/client";
import {recoveryServices} from "@/src/lib/recovery-service-rules";
import DriverDocuments from "./driver-documents";
const vehicleTypes=["Car","Van","Motorbike","4x4","Other"];
export default function DriverRegisterPage(){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[fullName,setFullName]=useState(""),[phone,setPhone]=useState(""),[companyName,setCompanyName]=useState(""),[truckType,setTruckType]=useState(""),[about,setAbout]=useState(""),[coveragePostcode,setCoveragePostcode]=useState(""),[coverageRadiusMiles,setRadius]=useState("25"),[services,setServices]=useState<string[]>([]),[vehicleCapabilities,setVehicles]=useState<string[]>([]),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const toggle=(value:string,list:string[],set:(values:string[])=>void)=>set(list.includes(value)?list.filter(x=>x!==value):[...list,value]);
 async function submit(e:FormEvent){
  e.preventDefault();if(busy)return;setBusy(true);setMessage("");
  try{
   const supabase=createClient();
   let {data:{user}}=await supabase.auth.getUser();
   if(!user){
    if(!email||password.length<10)throw Error("Enter an email and password of at least 10 characters.");
    const signup=await supabase.auth.signUp({email,password});
    if(signup.error)throw signup.error;
    if(!signup.data.session){setMessage("Check your email to verify your account, then sign in and return to finish your driver application.");return;}
    user=signup.data.user;
   }
   const result=await fetch("/api/driver/apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName,phone,companyName,about,truckType,coveragePostcode,coverageRadiusMiles:Number(coverageRadiusMiles),services,vehicleCapabilities})});
   const json=await result.json();if(!result.ok)throw Error(json.error||"Driver application unavailable");
   setMessage("Application saved. Admin verification is required before you can receive jobs.");
  }catch(e){setMessage(e instanceof Error?e.message:"Application temporarily unavailable");}
  finally{setBusy(false);}
 }
 return <main className="page-shell"><div className="page-card"><span className="eyebrow">UK Recovery · Driver network</span><h1>Join as a Recovery Driver</h1><p>Register yourself, set your recovery coverage and send your real profile for admin verification.</p>
  <form className="form-grid" onSubmit={submit}>
   <label>Account email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Required when creating an account"/></label>
   <label>New password<input type="password" autoComplete="new-password" minLength={10} value={password} onChange={e=>setPassword(e.target.value)} placeholder="For new accounts only"/></label>
   <label>Full name<input required maxLength={120} value={fullName} onChange={e=>setFullName(e.target.value)}/></label>
   <label>UK mobile number<input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="07123456789"/></label>
   <label>Company name (optional)<input maxLength={120} value={companyName} onChange={e=>setCompanyName(e.target.value)}/></label>
   <label>About your recovery service (optional)<textarea maxLength={1200} value={about} onChange={e=>setAbout(e.target.value)} placeholder="Describe your recovery experience and services"/></label><label>Recovery truck type<input required maxLength={120} value={truckType} onChange={e=>setTruckType(e.target.value)} placeholder="e.g. Flatbed recovery truck"/></label>
   <div className="two-column"><label>UK coverage postcode<input required value={coveragePostcode} onChange={e=>setCoveragePostcode(e.target.value.toUpperCase())} placeholder="M1 1AA"/></label><label>Coverage radius (miles)<input required type="number" min="1" max="300" value={coverageRadiusMiles} onChange={e=>setRadius(e.target.value)}/></label></div>
   <fieldset className="uk-driver-options"><legend>Recovery services offered</legend>{recoveryServices.map(v=><label key={v}><input type="checkbox" checked={services.includes(v)} onChange={()=>toggle(v,services,setServices)}/>{v}</label>)}</fieldset>
   <fieldset className="uk-driver-options"><legend>Vehicle types your truck can recover</legend>{vehicleTypes.map(v=><label key={v}><input type="checkbox" checked={vehicleCapabilities.includes(v)} onChange={()=>toggle(v,vehicleCapabilities,setVehicles)}/>{v}</label>)}</fieldset>
   <p className="form-help">Your location is checked against UK postcode coordinates. New profiles remain Pending until an admin approves them. Insurance and identity document verification must be completed before approval.</p>
   <button className="button primary button-large" disabled={busy||services.length===0||vehicleCapabilities.length===0}>{busy?"Saving application…":"Submit for Admin Review →"}</button>
   <p role="status">{message}</p>
  </form>
  <DriverDocuments/>
  <p><Link href="/login?role=driver&next=/driver/register">Already have a verified account? Sign in</Link></p>
 </div></main>;
}
