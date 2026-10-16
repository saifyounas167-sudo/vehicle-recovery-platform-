"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import PublicHeader from "@/app/components/public-header";
type Booking={reference:string;status:string;companyName:string;companyLogoUrl:string|null;priceGbp:number;etaMinutes:number;service:string;paymentMethod:string};
type Access={jobId:string;reference:string;proof:string};
const sessionKey="ukr-ss6-guest-access";
export default function BookingConfirmationPage(){
 const [booking,setBooking]=useState<Booking|null>(null);
 const [trackingJobId,setTrackingJobId]=useState<string|null>(null);
 const [state,setState]=useState<"checking"|"confirmed"|"preview"|"pending"|"unavailable">("checking");
 useEffect(()=>{let active=true;async function check(){
  try{
   const flag=await fetch("/api/client-review-status",{cache:"no-store"}).then(r=>r.json());
   if(flag.clientDemo!==false||flag.writesEnabled!==true){if(active)setState("preview");return;}
   const raw=sessionStorage.getItem(sessionKey);
   if(!raw){if(active)setState("unavailable");return;}
   const data=JSON.parse(raw) as Access;
   if(typeof data.jobId!=="string"||typeof data.reference!=="string"||typeof data.proof!=="string"){if(active)setState("unavailable");return;}
   const result=await fetch("/api/recovery/booking-confirmation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data),cache:"no-store"});
   if(!result.ok){if(active)setState("unavailable");return;}
   const info=await result.json();
   if(!active)return;
   if(info.confirmed===true&&info.booking){setBooking(info.booking);setTrackingJobId(data.jobId);setState("confirmed");}
   else setState("pending");
  }catch{if(active)setState("unavailable");}
 }void check();return()=>{active=false};},[]);
 return <><PublicHeader/><main className="uk-booking-page"><section className="uk-booking-panel" aria-labelledby="uk-booking-title">
 {state==="checking"?<><div className="uk-booking-symbol muted" aria-hidden="true">…</div><h1 id="uk-booking-title">Checking booking status</h1><p>Verifying your recovery details securely.</p></>
 :state==="confirmed"&&booking?<><div className="uk-booking-symbol success" aria-hidden="true">✓</div><h1 id="uk-booking-title">Recovery Booked!</h1><p>Your recovery with <strong>{booking.companyName}</strong> has been confirmed.</p><div className="uk-booking-info"><div className="uk-booking-company">{booking.companyLogoUrl?<img src={booking.companyLogoUrl} alt="" width={54} height={54}/>:<span aria-hidden="true">🚚</span>}<strong>{booking.companyName}</strong></div><dl><div><dt>Reference</dt><dd>{booking.reference}</dd></div><div><dt>Price</dt><dd>£{booking.priceGbp.toFixed(2)}</dd></div><div><dt>Estimated arrival</dt><dd>{booking.etaMinutes} minutes</dd></div><div><dt>Service</dt><dd>{booking.service}</dd></div><div><dt>Payment</dt><dd>{booking.paymentMethod}</dd></div></dl></div><p className="uk-booking-note">Your driver will contact you to confirm arrival details. ETA is an estimate, not a guarantee.</p></>
 :<><div className="uk-booking-symbol muted" aria-hidden="true">i</div><span className="uk-booking-preview-tag">{state==="preview"?"CLIENT REVIEW PREVIEW":"BOOKING NOT CONFIRMED"}</span><h1 id="uk-booking-title">{state==="preview"?"Booking Confirmation Preview":state==="pending"?"Booking Pending":"Booking Unavailable"}</h1><p>{state==="preview"?"This is a preview of Screenshot #6. No recovery has been booked and no driver has been selected.":state==="pending"?"We could not verify an accepted offer for this recovery request. No booking confirmation is available.":"No authorised confirmed booking could be found. Return to the recovery journey to review your request."}</p><div className="uk-booking-placeholder"><strong>Booking details</strong><p>Company, agreed price, ETA and service will appear only after a verified booking exists.</p><p>No payment has been taken.</p></div></>}
 <div className="uk-booking-actions">{state==="confirmed"&&booking&&trackingJobId?<Link className="uk-booking-primary" href={"/recovery/tracking/"+encodeURIComponent(trackingJobId)}>Track Recovery</Link>:null}{state==="confirmed"&&booking?<Link className="uk-booking-primary" href="/recovery/booking/details">View Booking</Link>:<Link className="uk-booking-primary" href="/recovery/booking/details">View Booking Status</Link>}<Link className="uk-booking-secondary" href="/">Back to Home</Link></div>
 <p className="uk-booking-footer">Real-time driver GPS tracking is not active. Tracking details are shown only for verified bookings.</p>
 </section></main></>;
}
