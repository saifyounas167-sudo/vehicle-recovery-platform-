import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

const modules = [
  ["Driver approvals", "Review recovery professionals, documents and approval status.", "Pending"],
  ["Live recovery jobs", "Monitor submitted, offered, assigned and in-progress jobs.", "Monitor"],
  ["Pricing rules", "Manage configurable pricing inputs without hard-coded business rules.", "Configure"],
  ["Subscriptions", "Review driver subscription and payment states.", "Manage"],
  ["Reports & disputes", "Keep operational issues and marketplace activity visible.", "Review"],
  ["Platform activity", "Maintain a clear operational view for the marketplace.", "Audit"],
];

export default async function AdminPage() {
  await requireRole("admin");
  return (
    <main className="dashboard-shell">
      <header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">Platform operations</p><h1>Admin dashboard</h1></div><span className="badge dark">Protected area foundation</span></div></header>
      <section className="container dashboard-content">
        <div className="dashboard-grid">
          <div className="metric-card"><span className="metric-label">Driver approvals</span><strong className="metric-value">Pending</strong><span className="badge">Review queue</span></div>
          <div className="metric-card"><span className="metric-label">Jobs</span><strong className="metric-value">Marketplace</strong><span className="badge dark">Operational view</span></div>
          <div className="metric-card"><span className="metric-label">Pricing</span><strong className="metric-value">Configurable</strong><span className="badge dark">Rules engine</span></div>
        </div>
        <div className="dashboard-card"><p className="dashboard-kicker">Operations</p><h2>Manage the marketplace from one design system.</h2><div className="module-grid">{modules.map(([title,text,action])=><article className="module-card" key={title}><div><strong>{title}</strong><p>{text}</p></div><span className="badge">{action}</span></article>)}</div></div>
      </section>
    </main>
  );
}