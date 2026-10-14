"use client";
import Link from "next/link";
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
 return <section className="ukr-hero" id="home" aria-label="Vehicle recovery"><div className="ukr-wrap">
  <h1 className="ukr-title">Need Vehicle <span className="ukr-accent">Recovery?</span></h1>
  <p className="ukr-sub">Find UK recovery options, compare independent driver offers when available, and choose who helps you.</p>
  <div className="ukr-actions" aria-label="Recovery actions">
   <Link href="/recovery/request" className="ukr-btn ukr-btn--primary"><span className="ukr-ico"><HeroIcon name="quote"/></span><span className="ukr-label">Get Recovery Quote</span><Arrow/></Link>
   <Link href="/recovery/nearby" className="ukr-btn"><span className="ukr-ico"><HeroIcon name="location"/></span><span className="ukr-label">Find Recovery Near Me</span><Arrow/></Link>
   <Link href="/driver/register" className="ukr-btn"><span className="ukr-ico"><HeroIcon name="truck"/></span><span className="ukr-label">Join as a Recovery Driver</span><Arrow/></Link>
  </div>
  <p className="ukr-trust-summary"><span aria-hidden="true">✓</span> Driver approval process <span aria-hidden="true">·</span> Independent offers <span aria-hidden="true">·</span> Your choice</p>
  <p className="ukr-demo-note">Live recovery bookings and payments are not yet available.</p>
 </div></section>;
}
