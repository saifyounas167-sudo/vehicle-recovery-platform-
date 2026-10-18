import AccountNavigation from "../components/account-navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
  const db=await createClient();
  const {count:pendingCount,error:pendingError}=await db.from("driver_profiles").select("id",{count:"exact",head:true}).eq("approval_status","pending");
  return (
    <main className="dashboard-shell">
      <header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">Platform operations</p><h1>Admin dashboard</h1></div><div className="dashboard-account-actions"><AccountNavigation/><span className="badge dark">Protected area foundation</span></div></div></header>
      <section className="container dashboard-content">
      <div className="dashboard-card" role="status"><div className="dashboard-card-heading"><div><p className="dashboard-kicker">In-app admin notification · Real registrations</p><h2>Driver Approval Inbox</h2></div><Link href="/admin/drivers" className="button primary">Review Drivers</Link></div><p>{pendingError?"Driver registration alerts temporarily unavailable.":pendingCount===0?"No new driver approval requests.":`${pendingCount} driver registration request${pendingCount===1?"":"s"} awaiting document review and an admin decision.`}</p><p>Only applications actually saved in the database are counted. No email, SMS or push notifications are sent.</p></div>
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