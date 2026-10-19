import type {ReactNode} from "react";

/** Screenshot #9 presentation only. This component never reads or writes billing data. */
export function MembershipView({accountNavigation}:{accountNavigation?:ReactNode}){
 const benefits=[
  "Receive recovery job notifications",
  "Send quotes to customers",
  "Manage your profile",
  "Cancel anytime"
 ];
 return <main className="ss9-screen">
  <header className="ss9-header">
   <div className="ss9-header-inner">
    <a href="/" className="ss9-logo" aria-label="UK Recovery home"><span className="ss9-logo-slash" aria-hidden="true">╱</span><span>UK<span className="ss9-logo-highlight">Recovery</span></span></a>
    <details className="ss9-nav">
     <summary aria-label="Open navigation menu" aria-controls="ss9-nav-links">
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
     </summary>
     <nav id="ss9-nav-links" className="ss9-nav-links" aria-label="Driver navigation">
      <a href="/">Home</a>
      <a href="/driver">Driver Dashboard</a>
      <a href="/driver/register">My Profile</a>
      {accountNavigation}
     </nav>
    </details>
   </div>
  </header>
  <div className="ss9-main">
   <h1>Driver Membership</h1>
   <p className="ss9-subtitle">Choose a plan to start receiving recovery jobs.</p>
   <section className="ss9-card" aria-labelledby="ss9-plan-title">
    <h2 id="ss9-plan-title">Monthly Plan</h2>
    <p className="ss9-price"><strong>£39.99</strong><span> / month</span></p>
    <ul className="ss9-benefits">
     {benefits.map(benefit=><li key={benefit}>
      <span className="ss9-benefit-icon" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg></span>
      <span>{benefit}</span>
     </li>)}
    </ul>
    <button className="ss9-subscribe" type="button" disabled aria-disabled="true" aria-describedby="ss9-disabled-reason">Subscribe with Stripe</button>
    <span id="ss9-disabled-reason" className="ss9-visually-hidden">Stripe payments are currently disabled. The displayed price is a design reference only.</span>
    <p className="ss9-secure"><svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></svg>Secure payment powered by Stripe</p>
   </section>
  </div>
 </main>;
}
