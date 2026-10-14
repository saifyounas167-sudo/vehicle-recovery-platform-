"use client";
import Link from "next/link";
import InstallAppButton from "./install-app-button";
import RecoveryServicesSection from "./components/recovery-services-section";
import InstallableWebAppSection from "./components/installable-web-app-section";
import PublicHeader from "./components/public-header";
import UkRecoveryHero from "./components/uk-recovery-hero";
import "./home-enhancements.css";

const steps=[["01","REQUEST RECOVERY","Enter your pickup, destination and vehicle details."],["02","GET AN ESTIMATE","Review an indicative price, subject to the request details."],["03","RECEIVE DRIVER OFFERS","Suitable approved drivers may propose a price and ETA."],["04","COMPARE & CHOOSE","Compare independent offers and select your preferred driver."],["05","RECOVERY COMPLETED","Your chosen professional carries out the recovery."],["06","PAY DRIVER DIRECTLY","Pay the selected driver or company directly, outside the platform."]];
export default function HomePage(){
 return <main className="uk-home">
  <PublicHeader/>
  <UkRecoveryHero/>

  <RecoveryServicesSection/>

  <section className="uk-how uk-how-compact" id="how"><div className="uk-section-head"><span className="uk-kicker">HOW IT WORKS</span><h2>Request. Compare. Choose.</h2><p>Explore the request, compare available driver prices and ETAs, and make your own choice.</p></div><div className="uk-steps">{steps.slice(0,4).map(([n,t,d])=><article key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div><div className="center-action"><Link href="/how-it-works">SEE HOW IT WORKS →</Link></div></section>

  <InstallableWebAppSection/>

  <section className="driver-cta" id="drivers"><div><span className="uk-kicker">FOR RECOVERY PROFESSIONALS</span><h2>Own a Recovery Business?</h2><p>Independent recovery drivers and companies can explore the planned UK marketplace. Registration and subscriptions are not yet live.</p><div><Link href="/driver/register" className="estimate-cta">BECOME A RECOVERY DRIVER →</Link></div></div><div className="truck-visual"><span>24/7</span><b>RECOVERY</b><small>Professional marketplace opportunities</small></div></section>

  <footer className="uk-footer"><div className="footer-main"><div><Link href="/" className="uk-logo"><span>UK</span><b>Recovery</b></Link><p>UK Recovery is a marketplace connecting customers with independent recovery providers.</p><InstallAppButton/></div><div><b>Customer</b><Link href="/recovery/request">Get Recovery</Link><Link href="/how-it-works">How It Works</Link><a href="#services">Services</a><Link href="/login?mode=signup">Create Account</Link></div><div><b>Drivers</b><Link href="/driver/register">Become a Driver</Link><Link href="/login">Driver Login</Link><Link href="/driver/membership">Membership</Link></div><div><b>Company</b><Link href="/about">About</Link><Link href="/how-it-works">Customer Journey</Link><a href="#trust">Trust & Choice</a></div><div><b>Explore</b><Link href="/how-it-works">How It Works</Link><a href="#install-app">Install App</a><a href="#payments">Direct Payments</a></div></div><div className="footer-bottom-new">© {new Date().getFullYear()} UK Recovery · UK vehicle recovery marketplace</div></footer>
 </main>
}