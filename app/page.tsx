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

  <section className="uk-how uk-how-compact" id="how"><div className="uk-section-head"><span className="uk-kicker">HOW IT WORKS</span><h2>Request. Compare. Choose.</h2><p>Explore the request, compare available driver prices and ETAs, and make your own choice.</p></div><div className="uk-steps">{steps.slice(0,4).map(([n,t,d])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div><div className="center-action"><Link href="/how-it-works">SEE HOW IT WORKS →</Link></div></section>

  <InstallableWebAppSection/>

  <section className="driver-cta" id="drivers"><div><span className="uk-kicker">FOR RECOVERY PROFESSIONALS</span><h2>Own a Recovery Business?</h2><p>Independent recovery drivers and companies can explore the planned UK marketplace. Registration and subscriptions are not yet live.</p><div><Link href="/driver/register" className="estimate-cta">BECOME A RECOVERY DRIVER →</Link></div></div><div className="truck-visual"><span>24/7</span><b>RECOVERY</b><small>Professional marketplace opportunities</small></div></section>

  <footer className="uk-footer"><div className="footer-main"><div><Link href="/" className="uk-logo"><span>UK</span><b>Recovery</b></Link><p>UK Recovery is a marketplace connecting customers with independent recovery providers.</p><InstallAppButton/></div><div><b>Customer</b><Link href="/recovery/request">Get Recovery</Link><Link href="/how-it-works">How It Works</Link><a href="#services">Services</a><Link href="/login?mode=signup">Create Account</Link></div><div><b>Drivers</b><Link href="/driver/register">Become a Driver</Link><Link href="/login">Driver Login</Link><Link href="/driver/membership">Membership</Link></div><div><b>Company</b><Link href="/about">About</Link><Link href="/how-it-works">Customer Journey</Link><a href="#trust">Trust & Choice</a></div><div><b>Explore</b><Link href="/how-it-works">How It Works</Link><a href="#install-app">Install App</a><a href="#payments">Direct Payments</a></div></div><div className="footer-bottom-new">© {new Date().getFullYear()} UK Recovery · UK vehicle recovery marketplace</div></footer>
 </main>
}