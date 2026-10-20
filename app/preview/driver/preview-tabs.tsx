"use client";
import {useState} from "react";
const tabs=["New Jobs","My Offers","Active","Complete"] as const;
type Tab=typeof tabs[number];
const entries:Record<Tab,{name:string;route:string;vehicle:string;status:string}[]>={
 "New Jobs":[{name:"Breakdown Recovery",route:"Sample pickup → Sample destination",vehicle:"Sample vehicle",status:"ASAP · SAMPLE"},{name:"Vehicle Transport",route:"Sample collection → Sample delivery",vehicle:"Sample car",status:"Scheduled · SAMPLE"}],
 "My Offers":[{name:"Sample Driver Offer",route:"Sample pickup → Sample destination",vehicle:"Sample vehicle",status:"Offer pending · SAMPLE"}],
 "Active":[{name:"Sample Active Recovery",route:"Sample pickup → Sample destination",vehicle:"Sample vehicle",status:"In progress · SAMPLE"}],
 "Complete":[{name:"Sample Completed Job",route:"Sample pickup → Sample destination",vehicle:"Sample vehicle",status:"Completed · SAMPLE"}]
};
export default function DriverPreviewTabs(){const [tab,setTab]=useState<Tab>("New Jobs");return <section className="pv-section" aria-label="Driver preview jobs"><div className="pv-tabs" role="tablist" aria-label="Driver dashboard tabs">{tabs.map(t=><button key={t} role="tab" aria-selected={tab===t} className={tab===t?"pv-tab-active":""} onClick={()=>setTab(t)}>{t}</button>)}</div><div className="pv-job-list" role="tabpanel">{entries[tab].map((j,i)=><article className="pv-card pv-job" key={i}><div><span className="pv-sample">SAMPLE JOB</span><h2>{j.name}</h2><p>{j.route}</p><p>Vehicle: {j.vehicle}</p><span className="pv-chip">{j.status}</span></div><button disabled className="pv-button">{tab==="New Jobs"?"View & Send Offer":"View Details"}</button></article>)}</div></section>}
