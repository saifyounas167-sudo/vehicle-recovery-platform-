import Link from "next/link";
import {requireRole} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function Page(){
 await requireRole("admin");
 const db=await createClient();
 const {data:jobs,error}=await db.from("recovery_jobs").select("id,guest_reference,recovery_type,pickup_postcode,destination_postcode,status,created_at,customer_id").order("created_at",{ascending:false}).limit(100);
 return <main className="dashboard-shell"><header className="dashboard-header"><div className="container dashboard-nav"><div><p className="dashboard-kicker">Platform operations</p><h1>Recovery Jobs</h1></div><Link href="/admin" className="button secondary">Admin dashboard</Link></div></header><section className="container dashboard-content"><div className="dashboard-card"><div className="dashboard-card-heading"><div><p className="dashboard-kicker">Production database</p><h2>Submitted Recovery Requests</h2></div><span className="badge dark">Admin only</span></div>{error?<p role="alert">Recovery records unavailable. Verify Production schema and Admin RLS policy.</p>:!jobs?.length?<p>No submitted requests yet.</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",textAlign:"left"}}><thead><tr><th>Reference</th><th>Service</th><th>Pickup</th><th>Destination</th><th>Status</th><th>Submitted</th></tr></thead><tbody>{jobs.map(j=><tr key={j.id}><td>{j.guest_reference||j.id.slice(0,8)}</td><td>{j.recovery_type}</td><td>{j.pickup_postcode}</td><td>{j.destination_postcode||"—"}</td><td>{j.status}</td><td>{new Date(j.created_at).toLocaleDateString("en-GB")}</td></tr>)}</tbody></table></div>}</div></section></main>;
}
