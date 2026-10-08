import Link from "next/link";
import {requireRole} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
import AcceptOffer from "./accept-offer";
export const dynamic="force-dynamic";
export default async function OffersPage(){
 const {user}=await requireRole("customer");const db=await createClient();
 const {data:jobs}=await db.from("recovery_jobs").select("id,recovery_type,pickup_postcode,status").eq("customer_id",user.id).order("created_at",{ascending:false}).limit(30);
 const ids=(jobs||[]).map(j=>j.id);
 const {data:offers}=ids.length?await db.from("driver_job_offers").select("id,job_id,offer_amount_gbp,eta_minutes,message,status").in("job_id",ids).order("created_at",{ascending:false}):{data:[]};
 return <main className="dashboard-shell"><header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">Customer marketplace</p><h1>Compare Driver Offers</h1></div><Link href="/customer" className="button secondary">My recoveries</Link></div></header><section className="container dashboard-content">{(jobs||[]).map(job=><article className="dashboard-card" key={job.id}><h2>{job.recovery_type} — {job.pickup_postcode}</h2><p>Job status: {job.status}</p>{(offers||[]).filter(o=>o.job_id===job.id).length===0?<p>No offers received yet.</p>:(offers||[]).filter(o=>o.job_id===job.id).map(o=><div className="dashboard-card nested-card" key={o.id}><strong>£{Number(o.offer_amount_gbp).toFixed(2)}</strong><p>Estimated arrival: {o.eta_minutes||"Not provided"} minutes</p><p>{o.message||"No message"}</p><p>Status: {o.status}</p>{o.status==="pending"&&["submitted","matching","offered"].includes(job.status)&&<AcceptOffer offerId={o.id}/>}</div>)}</article>)}{!jobs?.length&&<div className="dashboard-card">No recovery jobs yet.</div>}</section></main>;
}
