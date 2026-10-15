"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
type Driver={name:string;verified:boolean;imageUrl:string|null;truckType:string|null;services:string[];coverageRadiusMiles:number|null;rating:number|null;reviewCount:number};
type Offer={id:string;priceGbp:number;etaMinutes:number;message:string;status:string;driver:Driver};
type Guest={jobId:string;reference:string;proof:string};
type Sort="price"|"eta"|"rating";
export default function CustomerDriverOffers({access}:{access:Guest}){
 const [offers,setOffers]=useState<Offer[]>([]),[sort,setSort]=useState<Sort>("price"),[selected,setSelected]=useState<string|null>(null),[status,setStatus]=useState<"loading"|"ready"|"error">("loading"),[notice,setNotice]=useState(""),[working,setWorking]=useState(false),[accepted,setAccepted]=useState(false);
 const refresh=useCallback(async()=>{
  setStatus("loading");
  try{
   const response=await fetch("/api/recovery/guest-offers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(access),cache:"no-store"});
   if(!response.ok)throw Error("Could not retrieve offers");
   const json=await response.json() as {offers?:Offer[]};
   setOffers(Array.isArray(json.offers)?json.offers:[]);setStatus("ready");
  }catch{setStatus("error");}
 },[access.jobId,access.reference,access.proof]);
 useEffect(()=>{void refresh();},[refresh]);
 const sorted=useMemo(()=>[...offers].sort((a,b)=>sort==="price"?a.priceGbp-b.priceGbp:sort==="eta"?a.etaMinutes-b.etaMinutes:(b.driver.rating??-1)-(a.driver.rating??-1)),[offers,sort]);
 const current=offers.find(o=>o.id===selected);
 async function choose(){
  if(!current||working||accepted)return;
  setWorking(true);setNotice("");
  try{
   const res=await fetch("/api/recovery/accept-offer",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...access,offerId:current.id})});
   if(!res.ok)throw Error("This offer could not be accepted. Please refresh offers.");
   const result=await res.json();
   if(result.accepted!==true)throw Error("Acceptance was not confirmed.");
   setAccepted(true);setNotice("Your driver has been selected. Booking confirmation can now be viewed.");
   await refresh();
  }catch(e){setNotice(e instanceof Error?e.message:"Unable to select driver");}finally{setWorking(false);}
 }
 return <section className="uk-offers" aria-label={selected?"Driver details":"Driver offers"}>
  <div className="uk-marketplace-steps" aria-label="Recovery journey"><span>1 Details</span><span>2 Estimate</span><strong>{selected?"4 Choose":"3 Offers"}</strong><span>4 Choose</span></div>
  {selected&&current?<><button className="uk-offers-back" type="button" onClick={()=>setSelected(null)}>← Back to Driver Offers</button><h2>Driver Details</h2><article className="uk-offer-card">
   <div className="uk-offer-driver">{current.driver.imageUrl?<img alt="" src={current.driver.imageUrl} width={56} height={56}/>:<span className="uk-offer-avatar" aria-hidden="true">🚚</span>}<div><h3>{current.driver.name}</h3><small>{current.driver.verified?"✓ Verified Recovery Driver":"Verification not confirmed"}</small><p>{current.driver.rating!==null?`★ ${current.driver.rating.toFixed(1)} (${current.driver.reviewCount} reviews)`:"No reviews yet"}</p></div></div>
   <dl className="uk-driver-stats"><div><dt>Price</dt><dd>£{current.priceGbp.toFixed(2)}</dd></div><div><dt>ETA</dt><dd>{current.etaMinutes} minutes</dd></div><div><dt>Recovery truck</dt><dd>{current.driver.truckType||"Not supplied"}</dd></div><div><dt>Coverage radius</dt><dd>{current.driver.coverageRadiusMiles==null?"Not provided":current.driver.coverageRadiusMiles+" miles"}</dd></div><div><dt>Services</dt><dd>{current.driver.services.join(", ")||"Not provided"}</dd></div></dl>
   {current.message&&<p>{current.message}</p>}
   <button type="button" className="uk-offer-primary" disabled={working||accepted||current.status!=="pending"} onClick={choose}>{accepted?"Driver selected":working?"Confirming…":"Choose This Driver"}</button>
   <p className="uk-offer-hint">A booking is only confirmed when the server accepts your selection.</p>
  </article></>:<><h2>Driver Offers</h2><p>Compare offers from approved recovery drivers and choose the best option for you.</p>
   <div className="uk-offer-toolbar"><label htmlFor="uk-offer-sort">Sort by</label><select id="uk-offer-sort" value={sort} onChange={e=>setSort(e.target.value as Sort)}><option value="price">Price</option><option value="eta">ETA</option><option value="rating">Rating</option></select><button type="button" onClick={()=>void refresh()} disabled={status==="loading"}>Refresh offers</button></div>
   {status==="loading"&&<p role="status">Loading driver offers…</p>}{status==="error"&&<p role="alert">Unable to load offers. Please try Refresh offers.</p>}
   {status==="ready"&&sorted.length===0&&<p role="status" className="uk-offer-empty">No driver offers have been received yet.</p>}
   {status==="ready"&&sorted.map(offer=><article key={offer.id} className="uk-offer-card">
    <div className="uk-offer-driver">{offer.driver.imageUrl?<img src={offer.driver.imageUrl} alt="" width={48} height={48}/>:<span className="uk-offer-avatar" aria-hidden="true">🚚</span>}<div><h3>{offer.driver.name}</h3><small>{offer.driver.verified?"✓ Verified":"Verification not confirmed"}</small><p>{offer.driver.rating==null?"No reviews yet":`★ ${offer.driver.rating.toFixed(1)} (${offer.driver.reviewCount} reviews)`}</p></div></div>
    <div className="uk-offer-bottom"><div><strong>£{offer.priceGbp.toFixed(2)}</strong><small>ETA {offer.etaMinutes} mins</small></div><button type="button" onClick={()=>setSelected(offer.id)}>View Details</button></div>
   </article>)}
  </>}
  {notice&&<p role={accepted?"status":"alert"}>{notice}</p>}
 </section>;
}
