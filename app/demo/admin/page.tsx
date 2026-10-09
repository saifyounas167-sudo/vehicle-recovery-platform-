import Link from "next/link";
const modules=[
 ["Driver approvals","Verification, documents and insurance"],
 ["Recovery jobs","Request monitoring, matching and assignment"],
 ["Admin pricing rules","Minimum call-out, mileage and all configurable surcharges"],
 ["Offer system","Driver price/ETA and manual customer selection"],
 ["Membership and subscriptions","Driver payments, invoices and active membership"],
 ["Disputes and reports","Safety and operational oversight"]
];
export default function AdminDemo(){
 return <main className="dashboard-shell"><header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">CLIENT REVIEW · READ ONLY</p><h1>Admin Panel</h1></div><Link href="/demo" className="button secondary">All demos</Link></div></header>
 <section className="container dashboard-content"><div className="dashboard-card"><h2>Marketplace administration</h2><p>Read-only design review. No real pricing data, customer details or active drivers are exposed. Editing remains disabled until security testing and final business rates are approved.</p>
 <div className="module-grid">{modules.map(([name,detail])=><article className="module-card" key={name}><div><strong>{name}</strong><p>{detail}</p></div><span className="badge">Preview only</span></article>)}</div></div></section></main>;
}
