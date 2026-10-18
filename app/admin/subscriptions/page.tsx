import Link from "next/link";
import {requireRole} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function AdminSubscriptions(){
 await requireRole("admin");const db=await createClient();
 const [prices,memberships,payments]=await Promise.all([
  db.from("driver_billing_prices").select("amount_pence,currency,stripe_price_id,active_for_new,created_at").order("created_at",{ascending:false}).limit(20),
  db.from("driver_memberships").select("driver_id,status,valid_until,updated_at").order("updated_at",{ascending:false}).limit(40),
  db.from("driver_billing_payments").select("stripe_invoice_id,amount_paid_pence,currency,status,created_at").order("created_at",{ascending:false}).limit(20)
 ]);
 return <main className="dashboard-shell"><header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">ADMIN · SUBSCRIPTIONS</p><h1>Driver Billing Overview</h1></div><Link className="button secondary" href="/admin">Admin Dashboard</Link></div></header>
 <section className="container dashboard-content"><div className="dashboard-card"><h2>Billing controls are not active</h2><p>Stripe account and pricing approvals are pending. No price changes, customer charges or notifications can be triggered here.</p><p>Existing subscriptions retain their Stripe Price IDs by default. Price changes for existing subscribers must be individually scheduled in Stripe after advance notice and approval.</p></div>
 <div className="dashboard-card"><h2>New driver membership pricing</h2>{prices.error?<p>Pricing data unavailable.</p>:prices.data?.length?<div className="dashboard-list">{prices.data.map((p,i)=><div className="dashboard-row" key={i}><strong>{p.currency==="gbp"?"£"+(p.amount_pence/100).toFixed(2):"Price unavailable"} / month</strong><span>{p.active_for_new?"New drivers":"Inactive draft"}</span></div>)}</div>:<p>No approved Stripe prices configured yet. £39.99 is provisional.</p>}</div>
 <div className="dashboard-card"><h2>Memberships</h2>{memberships.error?<p>Membership data unavailable.</p>:memberships.data?.length?<div className="dashboard-list">{memberships.data.map(m=><div className="dashboard-row" key={m.driver_id}><span>Driver ID {m.driver_id.slice(0,8)}…</span><span>{m.status} · {m.valid_until?new Date(m.valid_until).toLocaleDateString("en-GB"):"No expiry"}</span></div>)}</div>:<p>No memberships recorded.</p>}</div>
 <div className="dashboard-card"><h2>Payment history</h2>{payments.error?<p>Payment history unavailable.</p>:payments.data?.length?<div className="dashboard-list">{payments.data.map(p=><div className="dashboard-row" key={p.stripe_invoice_id}><span>{p.status}</span><strong>{p.currency==="gbp"?"£"+(p.amount_paid_pence/100).toFixed(2):"Unknown currency"}</strong></div>)}</div>:<p>No verified Stripe invoices recorded.</p>}</div>
 </section></main>;
}
