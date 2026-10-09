import Link from "next/link";
export default function DemoIndex(){
 return <main className="dashboard-shell"><section className="container dashboard-content">
 <p className="dashboard-kicker">CLIENT REVIEW · NO LIVE TRANSACTIONS</p><h1>UK Recovery Marketplace Demo</h1>
 <p>Design and workflow preview only. No bookings, driver offers, payments, customer account changes, or admin changes can be submitted.</p>
 <div className="module-grid">
 <Link href="/recovery/request" className="module-card"><strong>Five-step customer form</strong><p>All ten services, postcode lookup and Leaflet route map; verified ORS road miles when available, price pending approval</p></Link>
 <Link href="/demo/driver" className="module-card"><strong>Driver Dashboard</strong><p>Driver workspace, offer system, verification and membership layout</p></Link>
 <Link href="/demo/admin" className="module-card"><strong>Admin Panel</strong><p>Pricing, approvals, jobs, subscriptions and disputes overview</p></Link>
 <Link href="/demo/customer" className="module-card"><strong>Customer Dashboard</strong><p>Request tracking and offer-selection overview</p></Link>
 </div><p><Link className="button secondary" href="/">Back to homepage</Link></p>
 </section></main>;
}
