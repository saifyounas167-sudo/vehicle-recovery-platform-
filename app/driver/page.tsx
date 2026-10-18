import AccountNavigation from "../components/account-navigation";
import OpenRoutePreview from "../components/open-route-preview";
import DriverAvailability from "./driver-availability";
import DriverDocuments from "./register/driver-documents";
import {isClientReviewDemo} from "@/src/lib/client-review";
import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DriverPage() {
  const { user } = await requireRole("driver");
  const supabase = await createClient();
  const { data: driver } = await supabase.from("driver_profiles").select("approval_status,company_name,availability").eq("id", user.id).maybeSingle();
  const approved = driver?.approval_status === "approved";
  const {data:membership}=await supabase.from("driver_memberships").select("status,valid_until").eq("driver_id",user.id).maybeSingle();
  const subscribed=membership?.status==="active" && !!membership.valid_until && new Date(membership.valid_until)>new Date();
  const marketplaceOpen=!isClientReviewDemo()||isIsolatedMarketplaceStaging();
  const canSeeJobs=approved && subscribed && marketplaceOpen;
  const {data:myOffers}=canSeeJobs?await supabase.from("driver_job_offers").select("id,job_id,offer_amount_gbp,eta_minutes,status,created_at").eq("driver_id",user.id).order("created_at",{ascending:false}).limit(50):{data:[]};
  const { data: jobs } = canSeeJobs ? await supabase.from("recovery_jobs").select("id,recovery_type,pickup_postcode,destination_postcode,is_urgent,status").in("status", ["submitted","matching","offered"]).order("created_at", { ascending: false }) : { data: [] };

  return <main className="dashboard-shell">
    <header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">Recovery professional</p><h1>Driver dashboard</h1></div><div className="dashboard-account-actions"><AccountNavigation/><Link href="/driver/membership" className="button secondary">Membership</Link><Link href="/driver/register" className="button primary">Manage profile</Link></div></div></header>
    <section className="container dashboard-content">
      <div className="dashboard-grid"><div className="metric-card"><span className="metric-label">Marketplace jobs</span><strong className="metric-value">{canSeeJobs ? jobs?.length ?? 0 : "—"}</strong><span className="badge">{canSeeJobs ? "Eligible data" : "Access restricted"}</span></div><div className="metric-card"><span className="metric-label">Driver status</span><strong className="metric-value">{driver?.approval_status ?? "Pending"}</strong><span className="badge dark">Admin review</span></div><div className="metric-card"><span className="metric-label">Account</span><strong className="metric-value">Protected</strong><span className="badge dark">Authenticated</span></div></div>
      <div className="dashboard-card"><p className="dashboard-kicker">Verification and account access</p><h2>{approved?"Driver approved":driver?.approval_status==="rejected"?"Application requires updates":driver?.approval_status==="suspended"?"Account suspended":"Pending Admin Approval"}</h2><p>{!approved?"Your profile and private verification documents are available below. Recovery jobs and offers remain locked until approval, active membership and marketplace activation.":!subscribed?"Your account is verified. An active membership is still required; payments remain unavailable during client review.":!marketplaceOpen?"Membership verified. Marketplace jobs and notifications are still paused in Production.":"Your driver account and membership meet the current staging eligibility prerequisites."}</p><p>Membership: <strong>{membership?.status||"Not active"}</strong> · Marketplace: <strong>{marketplaceOpen?"Staging review":"Paused"}</strong></p>{!approved&&driver?.approval_status!=="suspended"&&<><p><Link href="/driver/register" className="button secondary">Update application</Link></p><DriverDocuments/></>}</div>
      <div className="dashboard-card"><div className="dashboard-card-heading"><div><p className="dashboard-kicker">Job feed</p><h2>{canSeeJobs ? "Available recovery requests" : "Marketplace access locked"}</h2></div><span className="badge">{canSeeJobs ? "Staging only" : "Restricted"}</span></div>
      {canSeeJobs && jobs?.length ? <div className="dashboard-list">{jobs.map(job => <article className="dashboard-row" key={job.id}><div><strong>{job.recovery_type}</strong><small>{job.pickup_postcode}{job.destination_postcode ? " → " + job.destination_postcode : ""} · {job.status}</small></div><div className="row-actions"><span className="badge">{job.is_urgent ? "Urgent" : "Standard"}</span><Link href={"/driver/jobs/" + job.id} className="button secondary">View details</Link></div></article>)}</div> : <div className="empty-state"><strong>{canSeeJobs ? "No eligible jobs are available yet." : "Approval, an active membership and marketplace activation are required."}</strong><p>Only jobs that actually exist in the database appear here.</p></div>}</div>
      <DriverAvailability initial={driver?.availability||"offline"} approved={canSeeJobs}/>
      <div className="dashboard-card"><h2>My Offers</h2><p>{!canSeeJobs?"Offers are locked until approval, active membership and marketplace activation.":""}</p>{myOffers?.length?<div className="dashboard-list">{myOffers.map(o=><article className="dashboard-row" key={o.id}><div><strong>£{Number(o.offer_amount_gbp).toFixed(2)}</strong><small>ETA {o.eta_minutes??"—"} minutes · {o.status}</small></div><Link className="button secondary" href={"/driver/jobs/"+o.job_id}>View Job</Link></article>)}</div>:<p>No driver offers have been submitted yet.</p>}</div>
      <OpenRoutePreview/>
    </section>
  </main>;
}