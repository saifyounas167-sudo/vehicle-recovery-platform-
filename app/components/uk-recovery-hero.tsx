"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UkLocationSearch, { type UkLocationSuggestion } from "./uk-location-search";
import "./uk-recovery-hero.css";

type IconName="quote"|"location"|"truck";
function HeroIcon({name}:{name:IconName}){
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 {name==="quote"&&<path d="M7 17 17 7M8 7h9v9"/>}
 {name==="location"&&<><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></>}
 {name==="truck"&&<><path d="M3 16V8a1 1 0 0 1 1-1h9v9M13 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>}
 </svg>;
}
function Arrow(){return <svg className="ukr-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>}
export default function UkRecoveryHero(){
 const router=useRouter();
 const [pickup,setPickup]=useState("");
 const [dropoff,setDropoff]=useState("");
 const [pickupChoice,setPickupChoice]=useState<UkLocationSuggestion|null>(null);
 const [dropoffChoice,setDropoffChoice]=useState<UkLocationSuggestion|null>(null);
 const [quoteError,setQuoteError]=useState("");

 function continueQuote(){
  if(!pickup.trim()){
   setQuoteError("Please enter your pickup postcode, town or address.");
   return;
  }
  const params=new URLSearchParams();
  const pickupLabel=pickupChoice?.label||pickup.trim();
  params.set("pickupLocation",pickupLabel);
  if(pickupChoice?.postcode)params.set("pickup",pickupChoice.postcode);
  if(dropoff.trim()){
   params.set("destinationLocation",dropoffChoice?.label||dropoff.trim());
   if(dropoffChoice?.postcode)params.set("destination",dropoffChoice.postcode);
  }
  router.push("/recovery/request?"+params.toString());
 }
 return <section className="ukr-hero" id="home" aria-label="Vehicle recovery"><div className="ukr-wrap">
  <h1 className="ukr-title">Need Vehicle <span className="ukr-accent">Recovery?</span></h1>
  <p className="ukr-sub">Find UK recovery options, compare independent driver offers when available, and choose who helps you.</p>
  <div className="ukr-actions" aria-label="Recovery actions">
   <Link href="/recovery/request" className="ukr-btn ukr-btn--primary"><span className="ukr-ico"><HeroIcon name="quote"/></span><span className="ukr-label">Get Recovery Quote</span><Arrow/></Link>
   <Link href="/recovery/nearby" className="ukr-btn"><span className="ukr-ico"><HeroIcon name="location"/></span><span className="ukr-label">Find Recovery Near Me</span><Arrow/></Link>
   <Link href="/driver/register" className="ukr-btn"><span className="ukr-ico"><HeroIcon name="truck"/></span><span className="ukr-label">Join as a Recovery Driver</span><Arrow/></Link>
  </div>
  <section className="ukr-quote-slot" aria-labelledby="ukr-quick-quote-title">
   <div className="hero-quote-panel">
    <div className="ukr-quick-quote-heading"><span>QUICK QUOTE</span><h2 id="ukr-quick-quote-title">Where do you need recovery?</h2><p>Enter your pickup and, if known, your drop-off location to continue.</p></div>
    <div className="ukr-quick-quote-fields">
     <UkLocationSearch label="Pickup Location" value={pickup} required onChange={value=>{setPickup(value);setPickupChoice(null);setQuoteError("");}} onSelect={item=>{setPickupChoice(item);setPickup(item.label);setQuoteError("");}}/>
     <UkLocationSearch label="Drop-off Location (optional)" value={dropoff} onChange={value=>{setDropoff(value);setDropoffChoice(null);}} onSelect={item=>{setDropoffChoice(item);setDropoff(item.label);}}/>
    </div>
    {quoteError&&<p className="ukr-quick-quote-error" role="alert">{quoteError}</p>}
    <button type="button" className="ukr-quick-quote-submit" onClick={continueQuote}>Continue to Full Quote <Arrow/></button>
    <p className="ukr-quick-quote-note">You can confirm your full postcode and vehicle details on the next step. No recovery request is submitted here.</p>
   </div>
  </section>
  <p className="ukr-trust-summary"><span aria-hidden="true">✓</span> Driver approval process <span aria-hidden="true">·</span> Independent offers <span aria-hidden="true">·</span> Your choice</p>
  <p className="ukr-demo-note">Live recovery bookings and payments are not yet available.</p>
 </div></section>;
}
