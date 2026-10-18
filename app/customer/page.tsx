import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {requireRole} from "@/lib/auth";
import CustomerFrame from "./customer-frame";
import CustomerIcon,{type CustomerIconName} from "./customer-icons";

export const dynamic="force-dynamic";

type Job={
 id:string;recovery_type:string;pickup_postcode:string;
 destination_postcode:string|null;status:string;created_at:string;
};
type Offer={id:string;job_id:string;status:string;offer_amount_gbp:number|null;eta_minutes:number|null};

const currentStatuses=new Set(["submitted","matching","offered"]);
const bookedStatuses=new Set(["assigned","in_progress"]);
const historyStatuses=new Set(["completed","cancelled"]);
const prettyStatus=(status:string)=>({
 submitted:"Request submitted",matching:"Finding drivers",offered:"Offers received",
 assigned:"Driver assigned",in_progress:"In progress",completed:"Completed",cancelled:"Cancelled",draft:"Draft"
}[status]||status.replace(/_/g," "));
const date=(stamp:string)=>new Date(stamp).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});

function Empty({heading,description}:{heading:string;description:string}){
 return <div className="customer-empty"><div className="customer-empty-symbol" aria-hidden="true">⌁</div><strong>{heading}</strong><p>{description}</p></div>;
}
function Tile({label,description,href,icon,muted=false}:{label:string;description:string;href:string;icon:CustomerIconName;muted?:boolean}){
 return <Link href={href} className="customer-action-card">
  <span className={"customer-action-icon"+(muted?" is-muted":"")}><CustomerIcon name={icon} size={22}/></span>
  <span className="customer-action-copy"><strong>{label}</strong><small>{description}</small></span>
  <span className="customer-action-arrow"><CustomerIcon name="arrow" size={17}/></span>
 </Link>;
}
function JobList({jobs}:{jobs:Job[]}){
 return <div className="customer-jobs-list">{jobs.map(job=><article className="customer-job" key={job.id}>
  <div className="customer-job-leading"><span className="customer-job-icon"><CustomerIcon name="requests"/></span>
   <div><strong>{job.recovery_type}</strong><p>{job.pickup_postcode}{job.destination_postcode?" → "+job.destination_postcode:""}</p><small>{date(job.created_at)}</small></div>
  </div>
  <span className={"customer-status customer-status-"+(bookedStatuses.has(job.status)?"active":job.status==="completed"?"complete":job.status==="cancelled"?"cancelled":"pending")}>{prettyStatus(job.status)}</span>
 </article>)}</div>;
}

export default async function CustomerPage(){
 const {user,profile}=await requireRole("customer");
 const supabase=await createClient();
 // Server-side role guard + Supabase RLS; never query another customer's records.
 const {data:rows,error:jobsError}=await supabase.from("recovery_jobs")
  .select("id,recovery_type,pickup_postcode,destination_postcode,status,created_at")
  .eq("customer_id",user.id).order("created_at",{ascending:false}).limit(60);
 const jobs=(rows??[]) as Job[];
 const pending=jobs.filter(j=>currentStatuses.has(j.status)||j.status==="draft");
 const active=jobs.filter(j=>bookedStatuses.has(j.status));
 const history=jobs.filter(j=>historyStatuses.has(j.status));
 // Offers are read-only, selected only for the signed-in customer's existing jobs.
 const ids=jobs.map(j=>j.id);
 const {data:offersData,error:offersError}=!jobsError&&ids.length?
  await supabase.from("driver_job_offers").select("id,job_id,status,offer_amount_gbp,eta_minutes")
   .in("job_id",ids).order("created_at",{ascending:false}).limit(60):
  {data:[] as Offer[],error:null};
 const offers=(offersData??[]) as Offer[];
 const firstName=(profile.full_name?.trim().split(/\s+/)[0]||"").slice(0,45);
 return <CustomerFrame>
  <section className="customer-welcome" aria-labelledby="customer-welcome-title">
   <div><span className="customer-eyebrow">YOUR RECOVERY DASHBOARD</span>
    <h1 id="customer-welcome-title">{firstName?"Welcome back, "+firstName:"Welcome to UK Recovery"}</h1>
    <p>Manage your recovery requests and keep everything in one place.</p>
   </div>
   <Link href="/recovery/request" className="customer-primary-cta"><CustomerIcon name="quote" size={18}/> Get Recovery Quote <CustomerIcon name="arrow" size={17}/></Link>
  </section>

  <section className="customer-stats" aria-label="Your recovery overview">
   {[
    {name:"My Recovery Requests",value:jobsError?"—":jobs.length+(jobs.length===60?"+":""),icon:"requests" as CustomerIconName,note:"Recent requests"},
    {name:"Active Bookings",value:jobsError?"—":active.length+(jobs.length===60?"+":""),icon:"bookings" as CustomerIconName,note:"Assigned or in progress"},
    {name:"Booking History",value:jobsError?"—":history.length+(jobs.length===60?"+":""),icon:"history" as CustomerIconName,note:"Completed or cancelled"}
   ].map(stat=><div className="customer-stat" key={stat.name}>
    <div className="customer-stat-top"><span>{stat.name}</span><span className="customer-stat-icon"><CustomerIcon name={stat.icon}/></span></div>
    <strong>{stat.value}</strong><small>{stat.note}</small>
   </div>)}
  </section>

  <section className="customer-dashboard-section" aria-labelledby="customer-quick-title">
   <div className="customer-section-heading"><div><span className="customer-section-kicker">GET THINGS DONE</span><h2 id="customer-quick-title">Quick actions</h2></div></div>
   <div className="customer-actions-grid">
    <Tile href="/recovery/request" label="Get Recovery Quote" description="Start a new request" icon="quote"/>
    <Tile href="#requests" label="My Recovery Requests" description="See your requests" icon="requests"/>
    <Tile href="#offers" label="Driver Offers" description="Review offer availability" icon="offers" muted/>
    <Tile href="#tracking" label="Track My Recovery" description="View tracking status" icon="tracking" muted/>
    <Tile href="#history" label="Booking History" description="Previous recoveries" icon="history"/>
    <Tile href="/customer/account" label="My Profile / Settings" description="Your account information" icon="account"/>
   </div>
  </section>

  <section className="customer-dashboard-section" id="requests" aria-labelledby="customer-requests-title">
   <div className="customer-section-heading"><div><span className="customer-section-kicker">MY REQUESTS</span><h2 id="customer-requests-title">My Recovery Requests</h2></div>
    <Link href="/recovery/request" className="customer-text-link">New request <CustomerIcon name="arrow" size={16}/></Link></div>
   <div className="customer-panel">
    {jobsError?<Empty heading="Requests temporarily unavailable" description="Your information could not be loaded. Please try again later."/>:
    pending.length?<JobList jobs={pending}/>:<Empty heading="No recovery requests yet" description="When you make a request, it will appear here."/>}
   </div>
  </section>

  <div className="customer-two-up">
   <section className="customer-dashboard-section" id="offers" aria-labelledby="customer-offers-title">
    <div className="customer-section-heading"><div><span className="customer-section-kicker">COMPARE OPTIONS</span><h2 id="customer-offers-title">Driver Offers</h2></div></div>
    <div className="customer-panel customer-small-panel"><span className="customer-soft-icon"><CustomerIcon name="offers" size={24}/></span>
     {jobsError||offersError?<><h3>Offers temporarily unavailable</h3><p>We could not load your offer information.</p></>:
      <><h3>{offers.length?offers.length+" recorded offer"+(offers.length===1?"":"s"):"No driver offers yet"}</h3>
       <p>{offers.length?"Your real offer records are available. Comparing and accepting offers is currently paused.":"Offers will appear when this marketplace feature becomes available."}</p></>}
     <span className="customer-pause-label">Offers temporarily paused</span>
    </div>
   </section>
   <section className="customer-dashboard-section" id="bookings" aria-labelledby="customer-bookings-title">
    <div className="customer-section-heading"><div><span className="customer-section-kicker">CURRENT RECOVERIES</span><h2 id="customer-bookings-title">Active Bookings</h2></div></div>
    <div className="customer-panel customer-small-panel">
     {jobsError?<Empty heading="Bookings temporarily unavailable" description="Please try again later."/>:
      active.length?<JobList jobs={active}/>:<Empty heading="No active bookings" description="Confirmed bookings will be listed here when available."/>}
    </div>
   </section>
  </div>

  <section className="customer-dashboard-section" id="tracking" aria-labelledby="customer-tracking-title">
   <div className="customer-section-heading"><div><span className="customer-section-kicker">SCREENSHOT #7 · TRACKING</span><h2 id="customer-tracking-title">Track My Recovery</h2></div></div>
   <div className="customer-tracking-card">
    <span className="customer-tracking-marker"><CustomerIcon name="tracking" size={27}/></span>
    <div><h3>Recovery tracking</h3>
     <p>Live tracking is not enabled during the current client review. We will only show verified booking and driver information when it becomes available.</p>
     {active.length>0&&<p className="customer-tracking-note">You have a booking in progress. The tracking screen currently shows a read-only preview.</p>}
    </div>
    <span className="customer-pause-label">Live tracking unavailable</span>
   </div>
  </section>

  <section className="customer-dashboard-section" id="history" aria-labelledby="customer-history-title">
   <div className="customer-section-heading"><div><span className="customer-section-kicker">PAST ACTIVITY</span><h2 id="customer-history-title">Booking History</h2></div></div>
   <div className="customer-panel">{jobsError?<Empty heading="History temporarily unavailable" description="Please try again later."/>:
     history.length?<JobList jobs={history}/>:<Empty heading="No booking history" description="Completed or cancelled recoveries will appear here."/>}</div>
  </section>

  <footer className="customer-app-footer">UK RECOVERY <span>Account access protected. Marketplace transactions are currently paused.</span></footer>
 </CustomerFrame>;
}
