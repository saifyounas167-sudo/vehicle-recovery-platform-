"use client";
import Link from "next/link";
import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import InstallAppButton from "./install-app-button";
import PublicHeader from "./components/public-header";
import "./home-enhancements.css";

const services=[["⚡","Breakdown Recovery"],["⚠","Accident Recovery"],["↔","Vehicle Transport"],["↗","Car Towing"],["＋","Jump Start / Flat Battery Assistance"],["◉","Flat Tyre Assistance"],["◇","Motorbike Recovery"],["▰","Van Recovery"],["▤","Auction Vehicle Collection"],["⌁","Non-Running Vehicle Transport"]];
// Optimised local recovery image; keep the homepage controls unchanged.
const HERO_BACKGROUND_IMAGE="/recovery-hero.webp";
const steps=[["01","REQUEST RECOVERY","Enter your pickup, destination and vehicle details."],["02","GET AN ESTIMATE","Review an indicative price, subject to the request details."],["03","RECEIVE DRIVER OFFERS","Suitable approved drivers may propose a price and ETA."],["04","COMPARE & CHOOSE","Compare independent offers and select your preferred driver."],["05","RECOVERY COMPLETED","Your chosen professional carries out the recovery."],["06","PAY DRIVER DIRECTLY","Pay the selected driver or company directly, outside the platform."]];
export default function HomePage(){
 const [pickup,setPickup]=useState("");const [destination,setDestination]=useState("");const [locationText,setLocationText]=useState("");const [quoteOpen,setQuoteOpen]=useState(false);const pickupRef=useRef<HTMLInputElement>(null);const quoteToggleRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(quoteOpen)pickupRef.current?.focus();},[quoteOpen]);
 function quote(e:FormEvent){e.preventDefault();const q=new URLSearchParams();if(pickup)q.set("pickup",pickup);if(destination)q.set("destination",destination);window.location.href="/recovery/request?"+q.toString()}
 function locate(){if(!navigator.geolocation){setLocationText("Location is not available on this device.");return}setLocationText("Finding your location…");navigator.geolocation.getCurrentPosition(({coords})=>{const v=coords.latitude.toFixed(5)+", "+coords.longitude.toFixed(5);fetch("/api/recovery/postcode?lat="+coords.latitude+"&lng="+coords.longitude).then(r=>r.json()).then(data=>{if(!data.postcode)throw new Error();setPickup(data.postcode);setLocationText("Pickup postcode detected.");}).catch(()=>setLocationText("Could not find a postcode. Enter one manually."))},()=>setLocationText("Location permission was not granted."))}
 return <main className="uk-home">
  <PublicHeader/>
  <section className="uk-hero uk-hero-photo" style={{"--hero-image":`url("${HERO_BACKGROUND_IMAGE}")`} as CSSProperties}><div className="uk-hero-shade"/><div className="uk-hero-inner hero-reference-layout">
   <div className="uk-hero-copy"><span className="uk-kicker hero-trust-badge">UK VEHICLE RECOVERY MARKETPLACE</span><h1>Recovery On<br/><em>Your Terms.</em></h1><p>Request vehicle recovery, compare offers from independent recovery professionals and choose your preferred driver.</p></div>
   <div className="hero-action-panel"><p className="hero-action-title">How can we help?</p><p className="hero-action-intro">Choose one option to explore our recovery marketplace.</p><div className="hero-action-buttons"><button ref={quoteToggleRef} type="button" className="hero-action-primary" aria-expanded={quoteOpen} aria-controls="homepage-quick-quote" onClick={()=>setQuoteOpen(v=>!v)}><span aria-hidden="true">↗</span> Get Recovery Quote <span aria-hidden="true">→</span></button><Link href="/recovery/nearby" className="hero-action-secondary"><span aria-hidden="true">⌖</span> Find Recovery Near Me <span aria-hidden="true">→</span></Link><Link href="/driver/register" className="hero-action-secondary"><span aria-hidden="true">▰</span> Join as a Recovery Driver <span aria-hidden="true">→</span></Link></div><p className="hero-action-notice">Live bookings and payments are not yet available.</p>
   {quoteOpen&&<form id="homepage-quick-quote" className="quote-panel hero-quote-panel expanded-quote" onSubmit={quote}>
   <button type="button" className="close-quote" onClick={()=>{setQuoteOpen(false);quoteToggleRef.current?.focus()}}>Close quote form ×</button>
    <div className="hero-quote-grid">
     <label><span>Pickup postcode</span><div className="hero-input-wrap"><b>⌖</b><input ref={pickupRef} value={pickup} onChange={e=>setPickup(e.target.value)} placeholder="Enter pickup postcode" autoComplete="postal-code" required/></div></label>
     <label><span>Drop-off postcode</span><div className="hero-input-wrap"><b>●</b><input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="Enter destination postcode (if known)"/></div></label>
    </div>
    <button type="button" className="use-location hero-location" onClick={locate}>⌖ Use My Current Location</button>{locationText&&<small className="location-copy">{locationText}</small>}
    <button type="submit" className="estimate-cta hero-estimate">EXPLORE YOUR RECOVERY ESTIMATE <span aria-hidden="true">→</span></button>
    <p className="hero-market-note">Explore the recovery request process. Live submissions, offers and payments are not yet available.</p>
   </form>}</div>
  </div></section>

  <section className="uk-trust"><div>{[["✓","Driver approval process"],["↔","Independent price & ETA offers"],["⌖","Designed for UK postcodes"],["£","Pay driver directly"]].map(([i,t])=><article key={t}><b>{i}</b><span>{t}</span></article>)}</div></section>

  <section className="uk-section" id="services"><div className="uk-section-head"><span className="uk-kicker">RECOVERY SERVICES</span><h2>Recovery Services for Every Situation</h2><p>Explore the ten supported recovery and vehicle transport services. Each opens the existing demo request journey.</p></div><div className="uk-service-grid">{services.map(([i,t])=><Link href="/recovery/request" key={t} className="uk-service"><b>{i}</b><span>{t}</span><em>→</em></Link>)}</div></section>

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

  <section className="app-section" id="install-app" aria-labelledby="install-app-title">
   <div className="pwa-phone-stage"><div className="pwa-phone" aria-label="Non-interactive preview of the UK Recovery application"><div className="pwa-phone-notch" aria-hidden="true"/><div className="pwa-phone-screen"><div className="pwa-screen-brand"><span className="pwa-brand-mark">UK</span><span>UK <strong>Recovery</strong><small>VEHICLE RECOVERY</small></span><span className="pwa-screen-menu" aria-hidden="true">☰</span></div><span className="pwa-preview-label">RECOVERY MADE SIMPLE</span><h3>Help when you<br/><em>need it.</em></h3><p>Explore the recovery request journey.</p><div className="pwa-preview-field"><span>⌖</span><div><small>PICKUP LOCATION</small><strong>Enter UK postcode</strong></div></div><div className="pwa-preview-field"><span>↗</span><div><small>DESTINATION</small><strong>Choose drop-off point</strong></div></div><div className="pwa-preview-cta">GET RECOVERY ESTIMATE <span>→</span></div><div className="pwa-preview-foot">Request details <span>•</span> Driver offers <span>•</span> Your choice</div></div></div><span className="pwa-preview-caption">Interface preview · Not interactive</span></div>
   <div className="app-copy"><span className="uk-kicker">INSTALLABLE WEB APP</span><h2 id="install-app-title">Recovery Help<br/>in <em>Your Pocket.</em></h2><p>Add UK Recovery to your home screen for quick access to the website, recovery request form and account areas.</p><div className="pwa-benefits">{[["⌂","Home-screen access"],["↗","Recovery request journey"],["◎","Customer and driver areas"],["✓","No App Store download"]].map(([symbol,label])=><div key={label}><span aria-hidden="true">{symbol}</span><strong>{label}</strong></div>)}</div><InstallAppButton/><p className="pwa-safety-note">Live recovery submissions and payments are not yet available. Online connection required.</p><div className="install-guides"><div><b>iPhone / Safari</b><p>Share → Add to Home Screen → Open as Web App (if offered) → Add</p></div><div><b>Android / Chrome</b><p>Browser menu → Install app or Add to Home screen</p></div></div></div>
  </section>

  <section className="driver-cta" id="drivers"><div><span className="uk-kicker">FOR RECOVERY PROFESSIONALS</span><h2>Own a Recovery Business?</h2><p>The planned marketplace welcomes independent drivers and recovery companies. Create a profile, supply verification documents, receive admin approval and maintain a driver membership before receiving suitable opportunities and sending price and ETA offers. Registration and Stripe subscriptions are not yet live.</p><div><Link href="/driver/register" className="estimate-cta">BECOME A RECOVERY DRIVER →</Link><Link href="/driver/membership" className="driver-secondary">MEMBERSHIP INFORMATION</Link></div></div><div className="truck-visual"><span>24/7</span><b>RECOVERY</b><small>Professional marketplace opportunities</small></div></section>

  <section className="uk-section reviews" id="trust"><div className="uk-section-head"><span className="uk-kicker">MARKETPLACE PRINCIPLES</span><h2>Trust Starts With Transparency.</h2><p>We will only publish genuine feedback when it is available from verified completed recovery jobs. No sample ratings or fictional customer testimonials.</p></div><div className="review-grid">{[["01","Verification before participation","Driver profiles and relevant documents are reviewed for approval."],["02","Offers you can compare","See the price and estimated arrival time provided by each independent professional."],["03","Your decision, not an algorithm","Customers choose the recovery provider they prefer; the lowest bid is never selected automatically."]].map(([n,t,d])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div></section>

  <section className="uk-section home-payment" id="payments"><div className="uk-section-head"><span className="uk-kicker">PAYMENT CLARITY</span><h2>Pay Your Recovery Professional Directly.</h2><p>Customers pay their selected recovery driver or company directly. The platform does not process customer recovery payments in Phase 1.</p><p>Online recovery payments are not available.</p></div></section>

  <section className="final-cta"><div><h2>Need Recovery?</h2><p>Explore how a request and customer choice would work. Live recovery bookings are not yet available.</p></div><div><Link href="/recovery/request" className="estimate-cta">EXPLORE RECOVERY REQUEST →</Link><InstallAppButton/></div></section>

  <footer className="uk-footer"><div className="footer-main"><div><Link href="/" className="uk-logo"><span>UK</span><b>Recovery</b></Link><p>UK Recovery is a marketplace connecting customers with independent recovery providers.</p><InstallAppButton/></div><div><b>Customer</b><Link href="/recovery/request">Get Recovery</Link><Link href="/how-it-works">How It Works</Link><a href="#services">Services</a><a href="#payments">Payments</a><Link href="/login?mode=signup">Create Account</Link></div><div><b>Drivers</b><Link href="/driver/register">Become a Driver</Link><Link href="/login">Driver Login</Link><Link href="/driver/membership">Membership</Link></div><div><b>Company</b><Link href="/about">About</Link><Link href="/how-it-works">Customer Journey</Link><a href="#trust">Trust & Choice</a></div><div><b>Explore</b><Link href="/how-it-works">How It Works</Link><a href="#install-app">Install App</a><a href="#payments">Direct Payments</a></div></div><div className="footer-bottom-new">© {new Date().getFullYear()} UK Recovery · UK vehicle recovery marketplace</div></footer>
 </main>
}