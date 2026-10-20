import AccountNavigation from "../components/account-navigation";
import DriverAvailability from "./driver-availability";
import DriverJobTabs from "./driver-job-tabs";
import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {requireRole} from "@/lib/auth";
import {isIsolatedMarketplaceStaging} from "@/src/lib/marketplace-staging";
import "./driver-dashboard.css";

export const dynamic="force-dynamic";
export default async function DriverPage(){
 const {user}=await requireRole("driver");
 const supabase=await createClient();
 const [{data:driver, error:driverError},{data:membership,error:membershipError}]=await Promise.all([
  supabase.from("driver_profiles").select("approval_status,company_name,availability").eq("id",user.id).maybeSingle(),
  supabase.from("driver_memberships").select("status,valid_until").eq("driver_id",user.id).maybeSingle()
 ]);
 const approved=driver?.approval_status==="approved";
 const member=membership?.status==="active"&&!!membership.valid_until&&new Date(membership.valid_until)>new Date();
 const eligible=approved&&member;
 const {data:myOffers,error:offersError}=approved?await supabase.from("driver_job_offers").select("id,job_id,offer_amount_gbp,eta_minutes,status,created_at").eq("driver_id",user.id).order("created_at",{ascending:false}).limit(50):{data:[],error:null};
 const {data:jobs,error:jobsError}=eligible?await supabase.from("recovery_jobs").select("id,recovery_type,pickup_postcode,destination_postcode,vehicle_type,is_urgent,status,created_at,preferred_collection_time").in("status",["submitted","matching","offered"]).order("created_at",{ascending:false}).limit(50):{data:[],error:null};
 const acceptedIds=(myOffers??[]).filter(o=>o.status==="accepted").map(o=>o.job_id);
 const {data:assigned,error:assignedError}=approved&&acceptedIds.length?await supabase.from("recovery_jobs").select("id,recovery_type,pickup_postcode,destination_postcode,vehicle_type,is_urgent,status,created_at,preferred_collection_time").in("id",acceptedIds).eq("assigned_driver_id",user.id).limit(50):{data:[],error:null};
 return <main className="ss10-shell">
  <header className="ss10-header"><div className="ss10-top">
   <Link href="/" className="ss10-brand" aria-label="UK Recovery home"><span aria-hidden="true">◢</span> UK <b>Recovery</b></Link>
   <div className="ss10-header-actions">
    <span className="ss10-status" aria-label={"Availability: "+(driver?.availability||"offline")}>{driver?.availability==="available"?"● Online":driver?.availability==="busy"?"● Busy":"○ Offline"}</span>
    <Link href="/notifications" className="ss10-bell" aria-label="Notifications (delivery currently unavailable)">♧<span className="ss10-bell-icon" aria-hidden="true">♧</span></Link>
    <details className="ss10-menu"><summary aria-label="Driver menu">☰</summary><div><Link href="/driver">Dashboard</Link><Link href="/driver/membership">Membership</Link><Link href="/driver/register">Manage Profile</Link><AccountNavigation/></div></details>
   </div>
  </div></header>
  <section className="ss10-content" aria-label="Driver dashboard">
   <div className="ss10-heading"><div><p className="ss10-kicker">RECOVERY PROFESSIONAL</p><h1>Driver Dashboard</h1><p>{driver?.company_name||"Your recovery jobs and offers"}</p></div></div>
   {(driverError||membershipError)&&<p role="alert" className="ss10-notice">Driver eligibility information is temporarily unavailable. Job access is restricted.</p>}
   {!approved&&<p className="ss10-notice" role="status">Admin approval is required before accessing recovery jobs.</p>}
   {approved&&!member&&<p className="ss10-notice" role="status">An active membership is required for new jobs. <Link href="/driver/membership">View membership</Link></p>}
   <DriverAvailability initial={driver?.availability||"offline"} approved={approved} writesEnabled={isIsolatedMarketplaceStaging()}/>
   <DriverJobTabs jobs={jobs??[]} offers={myOffers??[]} assigned={assigned??[]} eligible={eligible} errors={{jobs:!!jobsError,offers:!!offersError,assigned:!!assignedError}}/>
   <p className="ss10-footnote">Live offers and bookings are paused during client review. Only real, authorised records are shown.</p>
  </section>
 </main>;
}
