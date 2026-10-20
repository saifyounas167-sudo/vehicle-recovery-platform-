import Link from "next/link";
import "../membership/membership.css";

export const metadata={title:"Driver Membership Pricing | UK Recovery",description:"Preview the recovery driver membership plan. Membership enrolment is not active during client review."};

/** Public information only: no Supabase account data, billing APIs or writes. */
export default function DriverPricingPage(){
 return <main className="ss9-screen">
  <header className="ss9-header"><div className="ss9-header-inner"><Link href="/" className="ss9-logo"><span>UK<span className="ss9-logo-highlight">Recovery</span></span></Link></div></header>
  <div className="ss9-main">
   <h1>Driver Membership / Pricing</h1>
   <p className="ss9-subtitle">For recovery drivers and companies throughout the UK.</p>
   <section className="ss9-card" aria-labelledby="public-plan-heading">
    <h2 id="public-plan-heading">Monthly Plan — Client Preview</h2>
    <p className="ss9-price"><strong>£39.99</strong><span> / month</span></p>
    <ul className="ss9-benefits">
     <li>Receive eligible recovery job notifications after approval</li>
     <li>Send quotes when marketplace offers are enabled</li>
     <li>Manage your driver and company profile</li>
    </ul>
    <p>The displayed price is from the client design reference and is not a confirmed live offer. Billing and subscriptions are currently disabled.</p>
    <p><Link href="/login?role=driver&next=/driver/membership">Driver Login to Manage Membership →</Link></p>
    <p><Link href="/driver/register">New driver? View Registration →</Link></p>
   </section>
  </div>
 </main>;
}
