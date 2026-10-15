"use client";
import {useState,type ReactNode} from "react";
import Link from "next/link";

export type EstimatePreview={available:boolean;estimateGbp?:number;distanceMiles?:number|null;reason?:string;route?:unknown;locations?:unknown};
type Props={estimate:EstimatePreview|null;estimating:boolean;vehicle:string;service:string;needsDestination:boolean;onEdit:()=>void;onRetry:()=>void;onSubmit?:()=>void;canSubmit?:boolean;submitting?:boolean};
const money=new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"});
export default function EstimateResult({estimate,estimating,vehicle,service,needsDestination,onEdit,onRetry,onSubmit,canSubmit=false,submitting=false}:Props){
 const [offersInfo,setOffersInfo]=useState(false);
 const validDistance=typeof estimate?.distanceMiles==="number"&&Number.isFinite(estimate.distanceMiles)&&estimate.distanceMiles>0;
 const validPrice=estimate?.available===true&&validDistance&&typeof estimate.estimateGbp==="number"&&Number.isFinite(estimate.estimateGbp)&&estimate.estimateGbp>0;
 const item=(icon:ReactNode,label:string,value:string)=><div className="uk-estimate-row"><span className="uk-estimate-icon" aria-hidden="true">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
 return <div className="uk-estimate-result" aria-labelledby="uk-estimate-title">
  <h2 id="uk-estimate-title">Estimated Price</h2>
  <p className="uk-estimate-intro">This is an estimated price based on your details. Final price may vary depending on the driver.</p>
  <div className="uk-estimate-price" role="status" aria-live="polite" aria-busy={estimating}>
   <span>Estimated Price</span>
   {estimating?<strong>Calculating estimate…</strong>:validPrice?<strong>{money.format(estimate!.estimateGbp!)}</strong>:<strong className="uk-estimate-fallback">Price to be confirmed by recovery drivers.</strong>}
   {!estimating&&!validPrice&&<p>{!needsDestination?"Roadside assistance does not have an approved distance-based estimate.":estimate?.reason&&estimate.reason!=="Price to be confirmed by recovery drivers"?estimate.reason:"An accurate road route or authorised pricing configuration is not available yet."}</p>}
  </div>
  <div className="uk-estimate-summary">
   {item("⌖","Distance",validDistance?estimate!.distanceMiles!.toFixed(2)+" road miles (postcode-centre route)":"Not verified")}
   {item("▣","Vehicle",vehicle||"Not provided")}
   {item("⚒","Recovery Service",service)}
  </div>
  <div className="uk-estimate-note" role="note"><span aria-hidden="true">ⓘ</span><p>Independent recovery companies may offer different prices and arrival times. No driver has been booked.</p></div>
  <button type="button" className="recovery-next uk-estimate-continue" disabled={submitting} onClick={()=>canSubmit?onSubmit?.():setOffersInfo(true)}>{canSubmit?(submitting?"Submitting request…":"Submit Recovery Request & Continue →"):"Continue →"}</button>
  {canSubmit&&<p className="uk-estimate-intro">Your request will be securely posted only after you select the button above. Real offers appear when approved drivers respond.</p>}
  {offersInfo&&!canSubmit&&<section className="uk-estimate-coming" role="status" aria-label="Driver offers read-only preview"><div className="uk-marketplace-steps" aria-label="Recovery journey"><span>1 Details</span><span>2 Estimate</span><strong aria-current="step">3 Offers</strong><span>4 Choose</span></div><h3>Driver Offers</h3><strong>Driver offers coming soon</strong><p>The marketplace is currently in read-only client review. No booking or driver request has been created.</p><p>No driver offers have been received yet. Live offers, prices and ETAs cannot be displayed until a verified request exists.</p><div className="uk-offer-card"><h3>Driver Details</h3><p>Driver details will appear after a verified driver sends an offer. No driver has been selected.</p><button type="button" className="uk-offer-primary" disabled>Choose This Driver — Unavailable</button><Link href="/recovery/booking" className="uk-booking-secondary">Preview Booking Confirmation (SS6) →</Link></div></section>}
  <div className="uk-estimate-actions"><button type="button" className="recovery-back" onClick={onEdit}>← Back / Edit Details</button>{!estimating&&!validPrice&&needsDestination&&<button type="button" onClick={onRetry}>Retry estimate</button>}</div>
 </div>;
}
