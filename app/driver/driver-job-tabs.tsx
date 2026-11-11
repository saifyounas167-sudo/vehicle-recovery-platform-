"use client";
import {useState} from "react";
import Link from "next/link";
type Job={id:string;recovery_type:string;pickup_postcode:string;destination_postcode:string|null;vehicle_type:string|null;is_urgent:boolean;status:string;created_at:string;preferred_collection_time:string|null};
type Offer={id:string;job_id:string;offer_amount_gbp:number;eta_minutes:number|null;status:string;created_at:string};
const format=(value:string)=>{const n=new Date(value);return Number.isNaN(n.getTime())?"Time unavailable":n.toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/London"});};
export default function DriverJobTabs({jobs,offers,assigned,eligible,errors}:{jobs:Job[];offers:Offer[];assigned:Job[];eligible:boolean;errors:{jobs:boolean;offers:boolean;assigned:boolean}}){
 const [tab,setTab]=useState("New Jobs");
 const tabs=["New Jobs","My Offers","Active","Complete"];
 const active=assigned.filter(j=>j.status==="assigned"||j.status==="in_progress");
 const complete=assigned.filter(j=>j.status==="completed");
 const current=tab==="New Jobs"?jobs:tab==="Active"?active:tab==="Complete"?complete:[];
 const failed=tab==="New Jobs"?errors.jobs:tab==="My Offers"?errors.offers:errors.assigned;
 return <section className="ss10-board" aria-label="Driver jobs">
  <div role="tablist" aria-label="Driver dashboard tabs" className="ss10-tabs">{tabs.map(label=><button key={label} type="button" role="tab" aria-selected={tab===label} tabIndex={tab===label?0:-1} className={tab===label?"active":""} onClick={()=>setTab(label)}>{label}</button>)}</div>
  <div role="tabpanel" className="ss10-panel" aria-label={tab}>
   {failed?<div className="ss10-empty" role="alert">Unable to load records. Please refresh and try again.</div>:
    tab==="My Offers"?(offers.length?<div className="ss10-jobs">{offers.map(o=><article className="ss10-job" key={o.id}><div className="ss10-job-top"><strong>My offer</strong><span className="ss10-pill">{o.status}</span></div><p>£{Number(o.offer_amount_gbp).toFixed(2)} · ETA {o.eta_minutes??"Unavailable"} minutes</p><small>Submitted {format(o.created_at)}</small><Link className="ss10-action" href={"/driver/jobs/"+o.job_id}>View Job</Link></article>)}</div>:<div className="ss10-empty">No offers submitted yet.</div>):
    current.length?<div className="ss10-jobs">{current.map(job=><article className="ss10-job" key={job.id}>
      <div className="ss10-job-top"><strong><span aria-hidden="true">▰ </span>{job.recovery_type}</strong><span className="ss10-time">{format(job.created_at)}</span></div>
      <p><span aria-hidden="true">⌖ </span>{job.pickup_postcode}{job.destination_postcode?" → "+job.destination_postcode:""}</p>
      {job.vehicle_type&&<p>Vehicle: {job.vehicle_type}</p>}
      <div className="ss10-job-bottom"><span className="ss10-pill">{job.is_urgent?"Urgent":job.preferred_collection_time?"Scheduled":"Standard"}</span><Link className="ss10-action" href={"/driver/jobs/"+job.id}>{tab==="New Jobs"?"View & Send Offer":"View Job"}</Link></div>
     </article>)}</div>:
    <div className="ss10-empty">{tab==="New Jobs"?!eligible?"Approved driver membership is required to view new jobs.":"No available recovery jobs right now.":tab==="Active"?"No active assigned jobs.":"No completed jobs yet."}</div>}
  </div>
 </section>;
}
