"use client";
import Link from "next/link";
import { CSSProperties, FormEvent, useState } from "react";
import InstallAppButton from "./install-app-button";
import PublicHeader from "./components/public-header";

const services=[["⚡","Breakdown Recovery"],["!","Accident Recovery"],["↔","Vehicle Transport"],["↗","Car Towing"],["+","Jump Start"],["○","Flat Tyre Assistance"],["◇","Motorbike Recovery"],["▰","Van Recovery"]];
// Replace this single URL later with the approved UK Recovery hero image.
const HERO_BACKGROUND_IMAGE="https://images.unsplash.com/photo-1699542108036-1c11c6ee0da3?auto=format&fit=crop&q=82&w=2400";
const steps=[["01","REQUEST RECOVERY","Enter pickup, destination and vehicle details."],["02","GET AN ESTIMATE","See an estimated recovery price."],["03","RECEIVE DRIVER OFFERS","Nearby verified recovery companies send price + ETA."],["04","CHOOSE YOUR DRIVER","Compare offers and select the company you prefer."],["05","RECOVERY COMPLETED","Your selected driver completes the recovery."]];
export default function HomePage(){
 const [pickup,setPickup]=useState("");const [destination,setDestination]=useState("");const [locationText,setLocationText]=useState("");
 function quote(e:FormEvent){e.preventDefault();const q=new URLSearchParams();if(pickup)q.set("pickup",pickup);if(destination)q.set("destination",destination);window.location.href="/recovery/request?"+q.toString()}
 function locate(){if(!navigator.geolocation){setLocationText("Location is not available on this device.");return}setLocationText("Finding your location…");navigator.geolocation.getCurrentPosition(({coords})=>{const v=coords.latitude.toFixed(5)+", "+coords.longitude.toFixed(5);setPickup(v);setLocationText("Current location captured.")},()=>setLocationText("Location permission was not granted."))}
 return <main className="uk-home">
  <PublicHeader/>
  <section className="uk-hero uk-hero-photo" style={{"--hero-image":`url("${HERO_BACKGROUND_IMAGE}")`} as CSSProperties}><div className="uk-hero-shade"/><div className="uk-hero-inner hero-reference-layout">
   <div className="uk-hero-copy"><span className="uk-kicker hero-trust-badge">★ UK-WIDE VEHICLE RECOVERY MARKETPLACE</span><h1>Vehicle Recovery<br/><em>Made Simple</em></h1><p>Request recovery, get an estimated price and compare offers from verified recovery professionals near you.</p></div>
   <form className="quote-panel hero-quote-panel" onSubmit={quote}>
    <div className="hero-quote-grid">
     <label><span>Pickup postcode</span><div className="hero-input-wrap"><b>⌖</b><input value={pickup} onChange={e=>setPickup(e.target.value)} placeholder="Enter pickup postcode" required/></div></label>
     <label><span>Drop-off postcode</span><div className="hero-input-wrap"><b>●</b><input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="Enter destination postcode" required/></div></label>
    </div>
    <button type="button" className="use-location hero-location" onClick={locate}>⌖ Use My Current Location</button>{locationText&&<small className="location-copy">{locationText}</small>}
    <button className="estimate-cta hero-estimate">GET RECOVERY ESTIMATE <span>→</span></button>
    <Link href="/recovery/request" className="hero-secondary">START RECOVERY REQUEST</Link>
    <p className="hero-market-note">Estimate first → post your request → compare nearby driver offers → choose your preferred recovery professional.</p>
   </form>
  </div></section>

  <section className="uk-trust"><div>{[["✓","Verified Recovery Companies"],["↔","Transparent Driver Offers"],["⌖","UK-Wide Marketplace"],["24/7","Request Access"]].map(([i,t])=><article key={t}><b>{i}</b><span>{t}</span></article>)}</div></section>

  <section className="uk-section" id="services"><div className="uk-section-head"><span className="uk-kicker">RECOVERY SERVICES</span><h2>Recovery Services for Every Situation</h2><p>One marketplace for everyday roadside recovery and vehicle transport needs.</p></div><div className="uk-service-grid">{services.map(([i,t])=><Link href="/recovery/request" key={t} className="uk-service"><b>{i}</b><span>{t}</span><em>→</em></Link>)}</div><div className="center-action"><a href="#services">VIEW ALL SERVICES →</a></div></section>

  <section className="uk-how" id="how"><div className="uk-section-head"><span className="uk-kicker">HOW IT WORKS</span><h2>Getting Recovery Is Simple</h2></div><div className="uk-steps">{steps.map(([n,t,d])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div><div className="center-action"><Link href="/how-it-works">SEE HOW IT WORKS →</Link></div></section>

  <section className="uk-section uk-why"><div className="uk-section-head"><span className="uk-kicker">WHY UK RECOVERY</span><h2>Built Around Trust and Customer Choice</h2></div><div className="uk-feature-grid">{[["✓","VERIFIED PROFESSIONALS","Recovery companies can be verified before full marketplace access."],["★","CUSTOMER CHOICE","Compare price, ETA, rating and verified status."],["£","TRANSPARENT OFFERS","You choose the offer that suits you."],["⌖","UK-WIDE NETWORK","Built to connect customers with recovery professionals across the UK."]].map(([i,t,d])=><article key={t}><b>{i}</b><h3>{t}</h3><p>{d}</p></article>)}</div></section>

  <section className="marketplace"><div><span className="uk-kicker">A REAL MARKETPLACE</span><h2>Your Recovery. <em>Your Choice.</em></h2><p>Your recovery request is shared with suitable nearby professionals. Receive offers, compare your options and choose the recovery company that's right for you.</p></div><div className="market-flow">{["Your Request","Nearby Drivers","Multiple Offers","Your Choice"].map((x,i)=><span key={x}><b>{i+1}</b>{x}{i<3&&<em>→</em>}</span>)}</div></section>

  <section className="app-section" id="install-app"><div className="phone-mock"><div className="phone-screen"><span>UK Recovery</span><b>Need recovery?</b><small>Start a request in seconds.</small><i>GET RECOVERY ESTIMATE</i></div></div><div className="app-copy"><span className="uk-kicker">INSTALLABLE WEB APP</span><h2>Recovery Help in Your Pocket</h2><p>Install UK Recovery on your phone for faster access to recovery requests, driver offers and live job updates.</p><ul><li>Faster access when you need recovery</li><li>Job and offer notifications</li><li>Driver status updates</li><li>Easy access from your home screen</li></ul><InstallAppButton/><strong>No app store required.</strong><div className="install-guides"><span><b>iPhone</b>Open in Safari → Share → Add to Home Screen</span><span><b>Android</b>Open in Chrome → Install App</span></div></div></section>

  <section className="driver-cta" id="drivers"><div><span className="uk-kicker">FOR RECOVERY PROFESSIONALS</span><h2>Own a Recovery Business?</h2><p>Join the marketplace, receive nearby recovery opportunities and grow your business.</p><div><Link href="/driver/register" className="estimate-cta">BECOME A RECOVERY DRIVER →</Link><Link href="/driver/membership" className="driver-secondary">VIEW DRIVER MEMBERSHIP</Link></div></div><div className="truck-visual"><span>24/7</span><b>RECOVERY</b><small>Professional marketplace opportunities</small></div></section>

  <section className="uk-section reviews"><div className="uk-section-head"><span className="uk-kicker">CUSTOMER REVIEWS</span><h2>Designed for Trusted Recovery Experiences</h2><p>Sample review cards below demonstrate the intended marketplace review UI. They are not published customer testimonials.</p></div><div className="review-grid">{[["★★★★★","Sample customer","Breakdown Recovery","“Example review content will appear here once verified customer reviews are available.”"],["★★★★★","Sample customer","Vehicle Transport","“This placeholder shows how recovery type, rating and customer feedback will be presented.”"],["★★★★★","Sample customer","Car Towing","“Real reviews will only be shown when the marketplace has verified completed jobs.”"]].map(([r,n,t,q])=><article key={t}><b>{r}</b><p>{q}</p><strong>{n}</strong><span>{t} · SAMPLE</span></article>)}</div></section>

  <section className="final-cta"><div><h2>Need Recovery?</h2><p>Start your recovery request and connect with suitable professionals near you.</p></div><div><Link href="/recovery/request" className="estimate-cta">GET RECOVERY ESTIMATE →</Link><InstallAppButton/></div></section>

  <footer className="uk-footer"><div className="footer-main"><div><Link href="/" className="uk-logo"><span>UK</span><b>Recovery</b></Link><p>UK Recovery is a marketplace connecting customers with independent recovery providers.</p><InstallAppButton/></div><div><b>Customer</b><Link href="/recovery/request">Get Recovery</Link><Link href="/how-it-works">How It Works</Link><a href="#services">Services</a><Link href="/login?mode=signup">Create Account</Link></div><div><b>Drivers</b><Link href="/driver/register">Become a Driver</Link><Link href="/login">Driver Login</Link><Link href="/driver/membership">Membership</Link></div><div><b>Company</b><span>About</span><span>Contact</span><span>FAQ</span></div><div><b>Legal</b><span>Terms</span><span>Privacy</span></div></div><div className="footer-bottom-new">© {new Date().getFullYear()} UK Recovery · UK-wide vehicle recovery marketplace</div></footer>
 </main>
}