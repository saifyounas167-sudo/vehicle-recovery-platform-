import Link from "next/link";
import AccountNavigation from "@/app/components/account-navigation";
import {createClient} from "@/lib/supabase/server";
import {requireRole} from "@/lib/auth";
import "./membership.css";
export const dynamic="force-dynamic";
const perks=["Receive recovery job notifications when the marketplace launches","Send quotes to customers after approval and activation","Manage your recovery business profile","Cancel your membership through Stripe when billing is available"];
function Icon({kind}:{kind:"check"|"shield"|"calendar"|"arrow"}){return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind==="check"?<path d="m5 12 4 4L19 6"/>:kind==="shield"?<><path d="m12 2 8 4v5c0 5-3 9-8 11-5-2-8-6-8-11V6l8-4Z"/><path d="m9 12 2 2 4-4"/></>:kind==="calendar"?<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>:<path d="m5 12h14m-6-6 6 6-6 6"/>}</svg>}
const formatStatus=(status:string)=>({inactive:"Not subscribed",pending:"Pending",active:"Active",past_due:"Past due",cancelled:"Cancelled",expired:"Expired"}[status]||"Not subscribed");
export default async function DriverMembershipPage(){
 const {user}=await requireRole("driver");
 const db=await createClient();
 const [membership,driver]=await Promise.all([
  db.from("driver_memberships").select("status,valid_until,updated_at").eq("driver_id",user.id).maybeSingle(),
  db.from("driver_profiles").select("approval_status").eq("id",user.id).maybeSingle()
 ]);
 const status=membership.error?"Unavailable":formatStatus(membership.data?.status||"inactive");
 const amountLabel="39.99";
 return <main className="ss9-page">
  <header className="ss9-topbar"><div className="ss9-topbar-inner">
   <Link href="/" className="ss9-logo" aria-label="UK Recovery homepage"><span className="ss9-logo-mark">╱</span> UK <strong>RECOVERY</strong></Link>
   <div className="ss9-top-actions"><Link href="/driver" className="ss9-back">Driver Dashboard</Link><AccountNavigation/></div>
  </div></header>
  <div className="ss9-content">
   <div className="ss9-breadcrumb"><Link href="/driver">Driver Account</Link><span>/</span><strong>Subscription</strong></div>
   <section className="ss9-heading"><span className="ss9-eyebrow">DRIVER SUBSCRIPTION</span><h1>Driver Membership</h1><p>Choose a plan to start receiving recovery jobs in your area once your account is approved and the marketplace launches.</p></section>
   <div className="ss9-columns">
    <section className="ss9-plan" aria-labelledby="ss9-plan-title">
     <div className="ss9-plan-head"><span className="ss9-plan-mark"><Icon kind="calendar"/></span><span>MONTHLY MEMBERSHIP</span></div>
     <div className="ss9-plan-body"><h2 id="ss9-plan-title">Monthly Plan</h2>
      <div className="ss9-price"><span className="ss9-currency">£</span><strong>{amountLabel}</strong><span>/ month</span></div>
      {<p className="ss9-provisional">Provisional price — awaiting client approval. No charges will be made.</p>}
      <p className="ss9-plan-description">One simple plan for recovery professionals. Driver verification and active membership are both required before receiving jobs.</p>
      <ul className="ss9-perks">{perks.map(text=><li key={text}><span className="ss9-check"><Icon kind="check"/></span><span>{text}</span></li>)}</ul>
      <button type="button" className="ss9-stripe-btn" disabled aria-disabled="true">Subscribe with Stripe <Icon kind="arrow"/></button>
      <p className="ss9-pay-note"><Icon kind="shield"/> Secure billing by Stripe when activated</p>
      <div className="ss9-notice" role="status"><strong>Stripe payments are not active yet.</strong><p>"Subscriptions cannot be purchased or renewed yet. This is a read-only preview until Stripe and pricing receive separate approval."</p></div>
     </div>
    </section>
    <aside className="ss9-side" aria-label="Membership status and guidance">
     <div className="ss9-info-card"><span className="ss9-card-kicker">YOUR MEMBERSHIP</span><h2>Membership Status</h2>
      <span className="ss9-status"><span className="ss9-status-dot"/>{status}</span>
      <dl><div><dt>Driver verification</dt><dd>{driver.error?"Unavailable":driver.data?.approval_status||"Pending"}</dd></div><div><dt>Membership valid until</dt><dd>{membership.data?.valid_until?new Date(membership.data.valid_until).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"Not available"}</dd></div></dl>
      {membership.error&&<p role="status">Membership status is temporarily unavailable.</p>}
     </div>
     <div className="ss9-info-card ss9-help-card"><div className="ss9-help-icon"><Icon kind="shield"/></div><h2>How membership works</h2><ol><li>Register and verify your driver account.</li><li>Choose a plan when billing opens.</li><li>Get approved and maintain an active membership to qualify for jobs.</li></ol><p>Membership does not bypass driver approval or unlock paused marketplace operations.</p></div>
    </aside>
   </div>
   <footer className="ss9-footer">UK RECOVERY <span>© Driver services · Marketplace in client-review mode</span></footer>
  </div>
 </main>;
}
