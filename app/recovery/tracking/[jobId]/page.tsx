"use client";
import Link from "next/link";
import {useParams} from "next/navigation";
import {useEffect,useState} from "react";
import PublicHeader from "@/app/components/public-header";
import RecoveryRouteMap from "@/app/components/recovery-route-map";
import "./tracking.css";
type Point={latitude:number;longitude:number};
type Tracking={bookingConfirmed:boolean;trackingAvailable:boolean;status:string;service?:string;reference?:string|null;driver?:{companyName:string;truckType:string|null;avatarUrl:string|null;verified:boolean;phone:string|null};offeredEtaMinutes?:number|null;liveEtaMinutes?:number|null;driverLocation?:Point|null;pickup?:{postcode:string;point:Point|null};destination?:{postcode:string|null;point:Point|null}};
const messages:Record<string,string>={assigned:"Driver Assigned",in_progress:"Recovery In Progress",completed:"Recovery Completed",cancelled:"Recovery Cancelled",offered:"Awaiting Driver Selection",submitted:"Request Submitted",matching:"Finding Recovery Drivers"};
export default function CustomerTrackingPage(){
 const params=useParams<{jobId:string}>(),jobId=params.jobId;
 const [mode,setMode]=useState<"checking"|"preview"|"ready"|"unavailable"|"denied">("checking");
 const [tracking,setTracking]=useState<Tracking|null>(null);
 useEffect(()=>{let active=true;
 (async()=>{try{
  const flag=await fetch("/api/client-review-status",{cache:"no-store"}).then(r=>r.json());
  if(flag.clientDemo!==false||flag.writesEnabled!==true){if(active)setMode("preview");return;}
  let method="GET",body:undefined|string;
  const raw=sessionStorage.getItem("ukr-ss6-guest-access");
  if(raw){try{const access=JSON.parse(raw);
   if(access.jobId===jobId&&typeof access.reference==="string"&&typeof access.proof==="string"){
    method="POST";body=JSON.stringify(access);
   }}catch{/* Authenticated customer can still use GET. */}}
  const response=await fetch("/api/recovery/tracking/"+encodeURIComponent(jobId),{method,
    ...(body?{body,headers:{"Content-Type":"application/json"}}:{}),cache:"no-store"});
  if(!active)return;
  if(response.status===403||response.status===404){setMode("denied");return;}
  if(!response.ok){setMode("unavailable");return;}
  const data=await response.json() as Tracking;
  if(!active)return;
  setTracking(data);setMode("ready");
 }catch{if(active)setMode("unavailable")}})();
 return()=>{active=false};
 },[jobId]);
 const confirmed=mode==="ready"&&tracking?.bookingConfirmed===true;
 const status=tracking?.status||"";
 return <><PublicHeader/><main className="ss7-page"><div className="ss7-wrap">
  <header className="ss7-intro">
   <span className="ss7-eyebrow">CUSTOMER TRACKING</span>
   <h1>{confirmed?messages[status]||"Recovery Status":mode==="checking"?"Checking Recovery":"Track Your Recovery"}</h1>
   <p>{confirmed?status==="assigned"?"A recovery driver has been assigned to your booking.":status==="in_progress"?"Your booking is marked as in progress. Live driver GPS may be unavailable.":status==="completed"?"This booking is marked as completed.":"Verified booking details are shown below.":mode==="preview"?"This is a read-only client preview. No driver has been dispatched or tracked.":"Only authorised customers can access verified recovery tracking details."}</p>
  </header>
  {confirmed&&tracking?.driver?<section className="ss7-content" aria-label="Recovery tracking details">
   <div className="ss7-map-card"><div className="ss7-section-head"><h2>Recovery Map</h2><span className="ss7-neutral-pill">Live GPS unavailable</span></div>
    {(tracking.pickup?.point||tracking.destination?.point)?
     <RecoveryRouteMap route={null} pickup={tracking.pickup?.point} destination={tracking.destination?.point}/>:
     <div className="ss7-map-empty" role="status"><span aria-hidden="true">⌖</span><strong>Map location unavailable</strong><p>No verified pickup or destination coordinates are available.</p></div>}
    <p className="ss7-map-note">Map markers show approximate verified postcode centres, not the driver's live location or movement.</p>
   </div>
   <div className="ss7-driver-card"><div className="ss7-driver-line">
    <div className="ss7-avatar" aria-hidden="true">{tracking.driver.avatarUrl?<img src={tracking.driver.avatarUrl} alt=""/>:<span>🚚</span>}</div>
    <div className="ss7-driver-title"><h2>{tracking.driver.companyName}</h2><span>{tracking.driver.verified?"✓ Approved recovery provider":"Recovery provider"}</span></div>
    {tracking.driver.phone?<a className="ss7-call" aria-label="Call your recovery driver" href={"tel:"+tracking.driver.phone.replace(/[^+0-9]/g,"")}>☎</a>:<span className="ss7-no-contact" aria-label="Driver phone unavailable">☎</span>}
   </div>
   <div className="ss7-details"><div><span>Offered ETA</span><strong>{tracking.offeredEtaMinutes!=null?tracking.offeredEtaMinutes+" minutes":"Not provided"}</strong><small>Original estimate, not live arrival time</small></div><div><span>Recovery Truck</span><strong>{tracking.driver.truckType||"Not provided"}</strong></div></div>
   <div className="ss7-details"><div><span>Booking Status</span><strong>{messages[status]||status}</strong></div><div><span>Service</span><strong>{tracking.service||"Recovery"}</strong></div></div>
   <div className="ss7-info" role="status">ⓘ Live driver location and continuously updated ETA are unavailable. We never simulate driver movement.</div>
   {!tracking.driver.phone&&<p className="ss7-footnote">Driver contact number is currently unavailable.</p>}
   </div>
  </section>:<section className="ss7-empty" aria-live="polite">
   <div className="ss7-empty-icon" aria-hidden="true">⌖</div>
   <h2>{mode==="preview"?"Customer Tracking Preview":mode==="checking"?"Verifying booking":mode==="denied"?"Tracking Not Available":mode==="ready"?"Recovery Not Yet Assigned":"Tracking Temporarily Unavailable"}</h2>
   <p>{mode==="preview"?"The SS7 interface is ready for secure data integration. No live booking, driver location, route or ETA is being simulated.":mode==="checking"?"Checking your authorisation and booking details.":mode==="denied"?"This booking could not be verified for your account.":mode==="ready"?"An accepted driver and confirmed booking are required before tracking details can appear.":"Please try again later. Live tracking is not active."}</p>
   <div className="ss7-preview-row"><span>Live driver GPS</span><strong>Unavailable</strong></div>
   <div className="ss7-preview-row"><span>Live arrival ETA</span><strong>Unavailable</strong></div>
  </section>}
  <div className="ss7-actions"><Link href="/recovery/booking/details" className="ss7-primary">View Booking Status</Link><Link href="/" className="ss7-secondary">Back to Home</Link></div>
 </div></main></>;
}
