"use client";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import InstallAppButton from "./install-app-button";
import RecoveryServicesSection from "./components/recovery-services-section";
import InstallableWebAppSection from "./components/installable-web-app-section";
import PublicHeader from "./components/public-header";
import UkRecoveryHero from "./components/uk-recovery-hero";
import UkLocationSearch, {type UkLocationSuggestion} from "./components/uk-location-search";
import "./home-enhancements.css";

const steps=[["01","REQUEST RECOVERY","Enter your pickup, destination and vehicle details."],["02","GET AN ESTIMATE","Review an indicative price, subject to the request details."],["03","RECEIVE DRIVER OFFERS","Suitable approved drivers may propose a price and ETA."],["04","COMPARE & CHOOSE","Compare independent offers and select your preferred driver."],["05","RECOVERY COMPLETED","Your chosen professional carries out the recovery."],["06","PAY DRIVER DIRECTLY","Pay the selected driver or company directly, outside the platform."]];
export default function HomePage(){
 const [pickup,setPickup]=useState("");const [destination,setDestination]=useState("");const [pickupCode,setPickupCode]=useState("");const [destinationCode,setDestinationCode]=useState("");const [locationText,setLocationText]=useState("");const [quoteOpen,setQuoteOpen]=useState(false);const pickupRef=useRef<HTMLInputElement>(null);const quoteToggleRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(quoteOpen)pickupRef.current?.focus();},[quoteOpen]);
 function quote(e:FormEvent){
  e.preventDefault();
  const q=new URLSearchParams();
  const pc=/^(GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;
  if(pickupCode||pc.test(pickup.trim()))q.set("pickup",pickupCode||pickup.trim());
  else if(pickup.trim())q.set("pickupLocation",pickup.trim());
  if(destinationCode||pc.test(destination.trim()))q.set("destination",destinationCode||destination.trim());
  else if(destination.trim())q.set("destinationLocation",destination.trim());
  window.location.href="/recovery/request?"+q.toString();
 }
 function selectLocation(kind:"pickup"|"destination",item:UkLocationSuggestion){
  if(kind==="pickup"){setPickup(item.label);setPickupCode(item.postcode||"");}
  else{setDestination(item.label);setDestinationCode(item.postcode||"");}
 }
 function locate(){if(!navigator.geolocation){setLocationText("Location is not available on this device.");return}setLocationText("Finding your location…");navigator.geolocation.getCurrentPosition(({coords})=>{const v=coords.latitude.toFixed(5)+", "+coords.longitude.toFixed(5);fetch("/api/recovery/postcode?lat="+coords.latitude+"&lng="+coords.longitude).then(r=>r.json()).then(data=>{if(!data.postcode)throw new Error();setPickup(data.postcode);setPickupCode(data.postcode);setLocationText("Pickup postcode detected.");}).catch(()=>setLocationText("Could not find a postcode. Enter one manually."))},()=>setLocationText("Location permission was not granted."))}
 return <main className="uk-home">
  <PublicHeader/>
  <UkRecoveryHero quoteOpen={quoteOpen} onToggleQuote={()=>setQuoteOpen(v=>!v)} quoteToggleRef={quoteToggleRef} quoteForm={
   <form id="homepage-quick-quote" className="quote-panel hero-quote-panel expanded-quote" onSubmit={quote}>
    <div className="hero-quote-grid">
     <UkLocationSearch label="Pickup Location" required value={pickup} inputRef={pickupRef} placeholder="Enter UK postcode, city or address" onChange={v=>{setPickup(v);setPickupCode("");}} onSelect={item=>selectLocation("pickup",item)}/>
     <UkLocationSearch label="Drop-off Location (optional)" value={destination} placeholder="Enter postcode, city or destination" onChange={v=>{setDestination(v);setDestinationCode("");}} onSelect={item=>selectLocation("destination",item)}/>
    </div>
    <button type="button" className="use-location hero-location" onClick={locate}>⌖ Use My Current Location</button>{locationText&&<small className="location-copy">{locationText}</small>}
    <button type="submit" className="estimate-cta hero-estimate">EXPLORE YOUR RECOVERY ESTIMATE <span aria-hidden="true">→</span></button>
    <p className="hero-market-note">Explore the recovery request process. Live submissions, offers and payments are not yet available.</p>
   </form>
  }/>

  <RecoveryServicesSection/>

  <section className="uk-how" id="how"><div className="uk-section-head"><span className="uk-kicker">HOW IT WORKS</span><h2>A Clear Journey, With You in Control</h2></div><div className="uk-steps">{steps.map(([n,t,d])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div><div className="center-action"><Link href="/how-it-works">SEE HOW IT WORKS →</Link></div></section>

  <section className="uk-section uk-why"><div className="uk-section-head"><span className="uk-kicker">WHY UK RECOVERY</span><h2>Built Around Trust and Customer Choice</h2></div><div className="uk-feature-grid">{[["✓","VERIFIED PROFESSIONALS","Drivers and recovery companies must meet profile, document and admin approval requirements before participating."],["★","CUSTOMER CHOICE","Compare any available offers by price, ETA and verification details, then make your own choice."],["£","TRANSPARENT OFFERS","Indicative estimates and independently submitted offers help you understand possible costs."],["⌖","UK-WIDE NETWORK","A marketplace concept for connecting UK customers with independent recovery operators."]].map(([i,t,d])=><article key={t}><b>{i}</b><h3>{t}</h3><p>{d}</p></article>)}</div></section>

  <section className="marketplace" aria-labelledby="marketplace-title">
   <div className="marketplace-intro"><span className="uk-kicker">A REAL MARKETPLACE</span><h2 id="marketplace-title">Your Recovery.<br/><em>Your Choice.</em></h2><p>Our marketplace is designed to connect customers with suitable approved recovery professionals. Compare independent price and ETA offers, then choose your preferred driver. No automatic cheapest-price assignment.</p></div>
   <ol className="market-flow" aria-label="How recovery offers work">
    {[
     {title:"Your Request",description:"Provide your recovery details.",icon:"request"},
     {title:"Suitable Drivers",description:"Eligible recovery professionals can receive suitable opportunities.",icon:"drivers"},
     {title:"Individual Offers",description:"Drivers can submit their own price and ETA.",icon:"offers"},
     {title:"Your Choice",description:"Compare offers and manually select your preferred driver.",icon:"choice"}
    ].map((step)=><li className="market-step" key={step.title}>
     <div className="market-step-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {step.icon==="request"&&<><path d="M9 4h11l5 5v19H9zM20 4v6h5M13 15h8M13 20h8M13 25h5"/><path d="M4 11v17h4"/></>}
      {step.icon==="drivers"&&<><circle cx="11" cy="11" r="4"/><circle cx="23" cy="12" r="3"/><path d="M3 26v-3a8 8 0 0 1 16 0v3H3zM21 20c4 0 7 2 8 6h-8"/></>}
      {step.icon==="offers"&&<><path d="M4 10V5h12l12 12-11 11L4 15z"/><circle cx="11" cy="11" r="2"/><path d="m16 19 3 3 5-6"/></>}
      {step.icon==="choice"&&<><circle cx="16" cy="16" r="12"/><path d="m10 16 4 4 8-9"/></>}
     </svg></div><h3>{step.title}</h3><p>{step.description}</p></li>)}
   </ol>
  </section>

  <InstallableWebAppSection/>

  <section className="driver-cta" id="drivers"><div><span className="uk-kicker">FOR RECOVERY PROFESSIONALS</span><h2>Own a Recovery Business?</h2><p>The planned marketplace welcomes independent drivers and recovery companies. Create a profile, supply verification documents, receive admin approval and maintain a driver membership before receiving suitable opportunities and sending price and ETA offers. Registration and Stripe subscriptions are not yet live.</p><div><Link href="/driver/register" className="estimate-cta">BECOME A RECOVERY DRIVER →</Link><Link href="/driver/membership" className="driver-secondary">MEMBERSHIP INFORMATION</Link></div></div><div className="truck-visual"><span>24/7</span><b>RECOVERY</b><small>Professional marketplace opportunities</small></div></section>

  <section className="uk-section reviews" id="trust"><div className="uk-section-head"><span className="uk-kicker">MARKETPLACE PRINCIPLES</span><h2>Trust Starts With Transparency.</h2><p>We will only publish genuine feedback when it is available from verified completed recovery jobs. No sample ratings or fictional customer testimonials.</p></div><div className="review-grid">{[["01","Verification before participation","Driver profiles and relevant documents are reviewed for approval."],["02","Offers you can compare","See the price and estimated arrival time provided by each independent professional."],["03","Your decision, not an algorithm","Customers choose the recovery provider they prefer; the lowest bid is never selected automatically."]].map(([n,t,d])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div></section>

  <section className="uk-section home-payment" id="payments"><div className="uk-section-head"><span className="uk-kicker">PAYMENT CLARITY</span><h2>Pay Your Recovery Professional Directly.</h2><p>Customers pay their selected recovery driver or company directly. The platform does not process customer recovery payments in Phase 1.</p><p>Online recovery payments are not available.</p></div></section>

  <section className="final-cta"><div><h2>Need Recovery?</h2><p>Explore how a request and customer choice would work. Live recovery bookings are not yet available.</p></div><div><Link href="/recovery/request" className="estimate-cta">EXPLORE RECOVERY REQUEST →</Link><InstallAppButton/></div></section>

  <footer className="uk-footer"><div className="footer-main"><div><Link href="/" className="uk-logo"><span>UK</span><b>Recovery</b></Link><p>UK Recovery is a marketplace connecting customers with independent recovery providers.</p><InstallAppButton/></div><div><b>Customer</b><Link href="/recovery/request">Get Recovery</Link><Link href="/how-it-works">How It Works</Link><a href="#services">Services</a><a href="#payments">Payments</a><Link href="/login?mode=signup">Create Account</Link></div><div><b>Drivers</b><Link href="/driver/register">Become a Driver</Link><Link href="/login">Driver Login</Link><Link href="/driver/membership">Membership</Link></div><div><b>Company</b><Link href="/about">About</Link><Link href="/how-it-works">Customer Journey</Link><a href="#trust">Trust & Choice</a></div><div><b>Explore</b><Link href="/how-it-works">How It Works</Link><a href="#install-app">Install App</a><a href="#payments">Direct Payments</a></div></div><div className="footer-bottom-new">© {new Date().getFullYear()} UK Recovery · UK vehicle recovery marketplace</div></footer>
 </main>
}