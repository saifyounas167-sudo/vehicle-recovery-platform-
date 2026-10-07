import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CustomerPage() {
  const { user } = await requireRole("customer");
  const supabase = await createClient();
  const { data: jobs } = await supabase.from("recovery_jobs").select("id,recovery_type,pickup_postcode,destination_postcode,status,estimated_quote_gbp,created_at").eq("customer_id", user.id).order("created_at", { ascending: false });

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">Customer account</p><h1>My recoveries</h1></div><Link href="/recovery/request" className="button primary">Get a Recovery Quote</Link></div></header>
      <section className="container dashboard-content">
        <div className="dashboard-card"><p className="dashboard-kicker">Your jobs</p><h2>Recovery requests from your account</h2>
          {jobs?.length ? <div className="dashboard-list">{jobs.map(job => <div className="dashboard-row" key={job.id}><div><strong>{job.recovery_type}</strong><small>{job.pickup_postcode}{job.destination_postcode ? " → " + job.destination_postcode : ""} · {job.status}</small></div><span className="badge">{job.estimated_quote_gbp ? "Estimate £" + job.estimated_quote_gbp : "Estimate pending"}</span></div>)}</div> : <div className="empty-state"><strong>No recovery requests yet.</strong><p>Your real submitted jobs will appear here.</p></div>}
        </div>
      </section>
    </main>
  );
}