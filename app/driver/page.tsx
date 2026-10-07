import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export default async function DriverPage() {
  const { user } = await requireRole("driver");
  const supabase = await createClient();
  const { data: driver } = await supabase.from("driver_profiles").select("approval_status,company_name").eq("id", user.id).maybeSingle();
  const approved = driver?.approval_status === "approved";
  const { data: jobs } = approved ? await supabase.from("recovery_jobs").select("id,recovery_type,pickup_postcode,destination_postcode,is_urgent,status").in("status", ["submitted","matching","offered"]).order("created_at", { ascending: false }) : { data: [] };

  return <main className="dashboard-shell">
    <header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">Recovery professional</p><h1>Driver dashboard</h1></div><Link href="/driver/register" className="button primary">Manage profile</Link></div></header>
    <section className="container dashboard-content">
      <div className="dashboard-grid"><div className="metric-card"><span className="metric-label">Marketplace jobs</span><strong className="metric-value">{approved ? jobs?.length ?? 0 : "—"}</strong><span className="badge">{approved ? "Live database" : "Approval required"}</span></div><div className="metric-card"><span className="metric-label">Driver status</span><strong className="metric-value">{driver?.approval_status ?? "Pending"}</strong><span className="badge dark">Admin review</span></div><div className="metric-card"><span className="metric-label">Account</span><strong className="metric-value">Protected</strong><span className="badge dark">Authenticated</span></div></div>
      <div className="dashboard-card"><div className="dashboard-card-heading"><div><p className="dashboard-kicker">Job feed</p><h2>{approved ? "Available recovery requests" : "Marketplace access is pending approval"}</h2></div><span className="badge">{approved ? "Live" : "Restricted"}</span></div>
      {approved && jobs?.length ? <div className="dashboard-list">{jobs.map(job => <article className="dashboard-row" key={job.id}><div><strong>{job.recovery_type}</strong><small>{job.pickup_postcode}{job.destination_postcode ? " → " + job.destination_postcode : ""} · {job.status}</small></div><div className="row-actions"><span className="badge">{job.is_urgent ? "Urgent" : "Standard"}</span><Link href={"/driver/jobs/" + job.id} className="button secondary">View details</Link></div></article>)}</div> : <div className="empty-state"><strong>{approved ? "No live jobs are available yet." : "Your account must be approved before marketplace jobs are visible."}</strong><p>Only jobs that actually exist in the database appear here.</p></div>}</div>
    </section>
  </main>;
}