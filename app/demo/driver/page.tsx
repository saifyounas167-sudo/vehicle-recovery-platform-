import Link from "next/link";
import OpenRoutePreview from "../../components/open-route-preview";
export default function DriverDemo(){
 return <main className="dashboard-shell"><header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">CLIENT REVIEW · READ ONLY</p><h1>Driver Dashboard</h1></div><Link href="/demo" className="button secondary">All demos</Link></div></header>
 <section className="container dashboard-content"><div className="dashboard-grid">
 <div className="metric-card"><span className="metric-label">Available jobs</span><strong className="metric-value">—</strong><span className="badge">Disabled for review</span></div>
 <div className="metric-card"><span className="metric-label">Verification</span><strong className="metric-value">Required</strong><span className="badge">No test accounts</span></div>
 <div className="metric-card"><span className="metric-label">Membership</span><strong className="metric-value">Required</strong><span className="badge">Offer creation paused</span></div>
 </div><div className="dashboard-card"><h2>Driver jobs and offers</h2><p>Marketplace job map/feed, price and ETA offers, active/completed jobs, documents, verification and subscription management remain part of the integrated application. For safety, no real jobs or actions appear in this demo.</p></div>
 <OpenRoutePreview/>
 </section></main>;
}
