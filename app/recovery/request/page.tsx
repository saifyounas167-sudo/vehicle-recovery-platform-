"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PublicHeader from "../../components/public-header";

const steps=["Location","Vehicle","Recovery","Details"];
const services=["Breakdown","Accident","Transport","Towing","Other assistance"];

export default function RecoveryRequestPage(){
  const [step,setStep]=useState(0);
  const [locationStatus,setLocationStatus]=useState("");
  const [runningStatus,setRunningStatus]=useState("");
  const [service,setService]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [pickup,setPickup]=useState("");
  const [destination,setDestination]=useState("");
  const [vehicleType,setVehicleType]=useState("");
  const [registration,setRegistration]=useState("");
  const [rollingStatus,setRollingStatus]=useState("");
  const [accessStatus,setAccessStatus]=useState("");
  const [customerName,setCustomerName]=useState("");
  const [phone,setPhone]=useState("");
  const [email,setEmail]=useState("");
  const [problemDescription,setProblemDescription]=useState("");
  const [lockedWheels,setLockedWheels]=useState(false);
  const [estimate,setEstimate]=useState<{available:boolean;estimatedPriceGbp?:number;route?:{distanceMiles:number};message?:string}|null>(null);
  const [estimateLoading,setEstimateLoading]=useState(false);

  useEffect(()=>{
    const query=new URLSearchParams(window.location.search);
    setPickup(query.get("pickup")||query.get("pickupPostcode")||"");
    setDestination(query.get("destination")||query.get("destinationPostcode")||"");
  },[]);
  useEffect(()=>{
    if(!pickup.trim()||!destination.trim()||!vehicleType||!runningStatus||!service){setEstimate(null);setEstimateLoading(false);return;}
    setEstimate(null);
    setEstimateLoading(true);
    const controller=new AbortController();
    const timeout=window.setTimeout(async()=>{
      try{
        const response=await fetch("/api/recovery/open-estimate",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({pickupPostcode:pickup,destinationPostcode:destination,vehicleType,runningStatus,lockedWheels,accident:service==="Accident"}),
          signal:controller.signal
        });
        if(!response.ok)throw new Error("Estimate unavailable");
        const data=await response.json();
        if(!controller.signal.aborted)setEstimate(data);
      }catch{if(!controller.signal.aborted)setEstimate({available:false,message:"Price to be confirmed by recovery drivers"});}
      finally{if(!controller.signal.aborted)setEstimateLoading(false);}
    },450);
    return()=>{window.clearTimeout(timeout);controller.abort();};
  },[pickup,destination,vehicleType,runningStatus,service,lockedWheels]);
  const progress=useMemo(()=>((step+1)/steps.length)*100,[step]);

  function useCurrentLocation(){
    if(!navigator.geolocation)return setLocationStatus("GPS is not supported on this device.");
    setLocationStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      ({coords})=>setLocationStatus("Location captured: "+coords.latitude.toFixed(5)+", "+coords.longitude.toFixed(5)),
      ()=>setLocationStatus("Location permission was not granted.")
    );
  }

  function next(){
    if(step===0&&(!/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test(pickup.trim())||!/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test(destination.trim()))){setError("Enter valid UK pickup and destination postcodes.");return;}
    if(step===1&&(!vehicleType||!runningStatus)){setError("Select a vehicle type and running condition.");return;}
    if(step===2&&!service){setError("Select a recovery service.");return;}
    setError("");setStep(s=>Math.min(3,s+1));window.scrollTo({top:0,behavior:"smooth"});
  }
  function back(){setError("");setStep(s=>Math.max(0,s-1));window.scrollTo({top:0,behavior:"smooth"});}

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(busy)return;
    if(!pickup||!destination||!vehicleType||!runningStatus||!service){setError("Complete all required recovery steps.");return;}
    if(!customerName.trim()||!phone.trim()||!email.trim()){setError("Name, phone and email are required.");return;}
    setError("");setBusy(true);
    try{
      const supabase=createClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){window.location.href="/login?reason=auth&next=/recovery/request";return;}
      const payload={pickupPostcode:pickup.trim().toUpperCase(),destinationPostcode:destination.trim().toUpperCase(),registration:registration.trim().toUpperCase(),vehicleType,runningStatus,rollingStatus,accessStatus,recoveryType:service,customerName:customerName.trim(),phone:phone.trim(),email:email.trim(),problemDescription:problemDescription.trim()};
      const res=await fetch("/api/recovery/jobs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const body=await res.json().catch(()=>({}));
      if(!res.ok)throw Error(typeof body.error==="string"?body.error:"We could not post your recovery request.");
      if(!body.job?.id)throw Error("Request was not confirmed by the server.");
      window.location.href="/customer?submitted="+encodeURIComponent(body.job.id);
    }catch(e){setError(e instanceof Error?e.message:"We could not post your recovery request.");setBusy(false);}
  }

  return <main className="request-wizard-shell">
    <PublicHeader/>
    <div className="request-wizard">
      <div className="wizard-progress"><div className="wizard-progress-top"><span>Step {step+1} of 4</span><strong>{steps[step]}</strong></div><div className="wizard-track"><i style={{width:progress+"%"}}/></div></div>
      <form onSubmit={submit}>
        {error&&<div className="alert error">{error}</div>}

        {step===0&&<section className="wizard-step">
          <div className="eyebrow">Step 1 · Location</div><h1>Where is the vehicle?</h1><p>Tell us where to collect it and where it needs to go.</p>
          <label>Pickup postcode or location<input name="pickupPostcode" autoComplete="postal-code" placeholder="e.g. M1 1AA" value={pickup} onChange={e=>setPickup(e.target.value)} required /></label>
          <button type="button" className="location-button" onClick={useCurrentLocation}>⌖ Use my current location</button>
          {locationStatus&&<p className="location-status">{locationStatus}</p>}
          <label>Destination postcode or location<input name="destinationPostcode" autoComplete="postal-code" placeholder="Where should we take it?" value={destination} onChange={e=>setDestination(e.target.value)} required /></label>
          <button type="button" className="button primary button-large wizard-main" onClick={next}>Continue →</button>
        </section>}

        {step===1&&<section className="wizard-step">
          <div className="eyebrow">Step 2 · Vehicle</div><h1>Which vehicle needs help?</h1><p>We only need the basics. Vehicle data can be filled automatically when the vehicle API is connected.</p>
          <label>Vehicle registration<input name="registration" placeholder="e.g. AB12 CDE" value={registration} onChange={e=>setRegistration(e.target.value)} /></label>
          <label>Vehicle type<select name="vehicleType" value={vehicleType} onChange={e=>setVehicleType(e.target.value)}><option value="">Select vehicle type</option><option>Car</option><option>Van</option><option>Motorbike</option><option>Other</option></select></label>
          <fieldset className="choice-field"><legend>Can the vehicle move under its own power?</legend><div className="choice-grid"><label className={runningStatus==="Running"?"choice active":"choice"}><input type="radio" name="runningChoice" value="Running" onChange={()=>setRunningStatus("Running")}/><strong>Running</strong><span>Vehicle can move</span></label><label className={runningStatus==="Non-running"?"choice active":"choice"}><input type="radio" name="runningChoice" value="Non-running" onChange={()=>setRunningStatus("Non-running")}/><strong>Non-running</strong><span>Vehicle cannot move</span></label></div></fieldset>
          <div className="wizard-actions"><button type="button" className="button secondary" onClick={back}>← Back</button><button type="button" className="button primary" onClick={next}>Continue →</button></div>
        </section>}

        {step===2&&<section className="wizard-step">
          <div className="eyebrow">Step 3 · Recovery</div><h1>What kind of help do you need?</h1><p>Choose the closest option. We will only ask extra questions when they matter.</p>
          <div className="service-choice-grid">{services.map(x=><label key={x} className={service===x?"service-choice active":"service-choice"}><input type="radio" name="serviceChoice" value={x} onChange={()=>setService(x)}/><strong>{x}</strong></label>)}</div>
          {runningStatus==="Non-running"&&<div className="conditional-card"><strong>One quick question</strong><label>Can the vehicle roll freely?<select name="rollingStatus" value={rollingStatus} onChange={e=>{setRollingStatus(e.target.value);setLockedWheels(e.target.value==="No / wheels locked");}}><option value="">Select</option><option>Yes</option><option>No / wheels locked</option><option>Not sure</option></select></label></div>}
          {service==="Accident"&&<div className="conditional-card"><strong>Accident recovery</strong><label>Is the vehicle safely accessible?<select name="accessStatus" value={accessStatus} onChange={e=>setAccessStatus(e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option><option>Not sure</option></select></label></div>}
          <div className="wizard-actions"><button type="button" className="button secondary" onClick={back}>← Back</button><button type="button" className="button primary" onClick={next}>Continue →</button></div>
        </section>}

        {step===3&&<section className="wizard-step">
          <div className="eyebrow">Step 4 · Details & estimate</div><h1>Almost done.</h1><p>Add your contact details and anything important the recovery professional should know.</p>
          <label>Your name<input name="customerName" autoComplete="name" value={customerName} onChange={e=>setCustomerName(e.target.value)} required /></label>
          <label>Mobile number<input name="phone" type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} required /></label>
          <label>Email<input name="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
          <label>What happened?<textarea name="problemDescription" rows={4} placeholder="Briefly tell us what the driver should know." value={problemDescription} onChange={e=>setProblemDescription(e.target.value)}/></label>
          <div className="estimate-card"><span>Estimated recovery price</span><strong aria-live="polite">{estimateLoading?"Calculating estimated price…":estimate?.available&&typeof estimate.estimatedPriceGbp==="number"?"£"+estimate.estimatedPriceGbp.toFixed(2):"Price to be confirmed by recovery drivers"}</strong>{estimate?.route&&<p>{estimate.route.distanceMiles.toFixed(2)} road miles (postcode-centre route)</p>}<p>Your request goes live after posting. Nearby approved drivers can then send offers for you to compare.</p></div>
          <div className="wizard-actions"><button type="button" className="button secondary" onClick={back}>← Back</button><button type="submit" className="button primary button-large" disabled={busy}>{busy?"Posting request…":"Post Recovery Request →"}</button></div>
        </section>}
      </form>
      <div className="wizard-after"><span>Job goes live</span><b>→</b><span>Drivers send offers</span><b>→</b><span>You choose</span></div>
    </div>
  </main>;
}