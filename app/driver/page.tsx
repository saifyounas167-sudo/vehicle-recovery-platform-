import Link from "next/link";

const jobs = [
  ["Breakdown Recovery", "M1 1AA → M20 2AB", "Urgent", "Review"],
  ["Vehicle Transport", "B1 1AA → CV1 2XY", "Scheduled", "Review"],
  ["Flat Tyre Assistance", "LS1 4AB", "New", "Review"],
];

export default function DriverPage() {
  return (
    <main className="dashboard-shell">
      <header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">Recovery professional</p><h1>Driver dashboard</h1></div><Link href="/driver/register" className="button primary">Complete profile</Link></div></header>
      <section className="container dashboard-content">
        <div className="dashboard-grid">
          <div className="metric-card"><span className="metric-label">Open jobs</span><strong className="metric-value">3</strong><span className="badge">Marketplace</span></div>
          <div className="metric-card"><span className="metric-label">Assignments</span><strong className="metric-value">0</strong><span className="badge dark">Awaiting approval</span></div>
          <div className="metric-card"><span className="metric-label">Profile status</span><strong className="metric-value">Pending</strong><span className="badge dark">Admin review</span></div>
        </div>
        <div className="dashboard-card"><div className="dashboard-card-heading"><div><p className="dashboard-kicker">Job feed</p><h2>Suitable recovery requests</h2></div><span className="badge">Preview</span></div><div className="dashboard-list">{jobs.map(([title,route,status,action])=><div className="dashboard-row" key={title}><div><strong>{title}</strong><small>{route}</small></div><div className="row-actions"><span className="badge">{status}</span><button className="button secondary">{action}</button></div></div>)}</div></div>
        <div className="dashboard-card"><p className="dashboard-kicker">Driver journey</p><h2>Job Feed → Details → Offer / Accept → Assignment → Completion</h2><p className="dashboard-help">The dashboard is structured around the marketplace workflow. Authentication, matching and live job actions remain reserved for the platform services layer.</p></div>
      </section>
    </main>
  );
}