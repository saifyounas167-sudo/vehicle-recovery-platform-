import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export default async function DriverJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole("driver");
  const supabase = await createClient();
  const { data: driver } = await supabase.from("driver_profiles").select("approval_status").eq("id", user.id).maybeSingle();
  if (driver?.approval_status !== "approved") return notFound();

  const { id } = await params;
  const { data: job } = await supabase.from("recovery_jobs").select("id,recovery_type,pickup_postcode,destination_postcode,vehicle_type,running_status,problem_description,is_urgent,status,preferred_collection_time").eq("id", id).maybeSingle();
  if (!job) return notFound();

  return <main className="dashboard-shell"><header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">Marketplace job</p><h1>{job.recovery_type}</h1></div><Link href="/driver" className="button secondary">Back to feed</Link></div></header><section className="container dashboard-content"><div className="dashboard-card"><div className="safety-badges"><span>{job.is_urgent ? "Urgent" : "Standard"}</span><span>{job.status}</span></div><div className="detail-grid"><div><span>Pickup</span><strong>{job.pickup_postcode}</strong></div><div><span>Destination</span><strong>{job.destination_postcode || "Not specified"}</strong></div><div><span>Vehicle</span><strong>{job.vehicle_type || "Not specified"}</strong></div><div><span>Running status</span><strong>{job.running_status || "Not specified"}</strong></div></div><div className="dashboard-card nested-card"><p className="dashboard-kicker">Problem / condition</p><p className="dashboard-help">{job.problem_description || "No additional condition details supplied."}</p></div><div className="row-actions"><button className="button primary" disabled>Offer / Accept — platform action</button></div><p className="dashboard-help">Offer and assignment actions are intentionally disabled until the authenticated marketplace workflow and confirmed business rules are connected.</p></div></section></main>;
}