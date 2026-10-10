"use client";
import {useEffect,useState} from "react";
import PublicHeader from "../../components/public-header";
import RecoveryRouteMap from "../../components/recovery-route-map";
import UkLocationSearch, {type UkLocationSuggestion} from "../../components/uk-location-search";

const steps=["Location","Vehicle","Recovery","Customer","Review"];
const services=["Breakdown Recovery","Accident Recovery","Vehicle Transport","Car Towing","Jump Start / Flat Battery Assistance","Flat Tyre Assistance","Motorbike Recovery","Van Recovery","Auction Vehicle Collection","Non-Running Vehicle Transport"];
const postcode=/^(GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}))$/i;
const phone=/^(?:\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}$/;
type Values=Record<string,string>;
const initial:Values={pickupPostcode:"",destinationPostcode:"",destinationMode:"transport",pickupAddress:"",destinationAddress:"",registration:"",make:"",model:"",vehicleType:"",transmission:"",runningStatus:"",rollingStatus:"",lockedWheels:"",damagedWheels:"",accident:"",recoveryType:"",problemDescription:"",timing:"urgent",preferredCollectionTime:"",equipment:"",difficulty:"",customerName:"",phone:"",email:"",contactPreference:"Phone"};
export default function RecoveryRequestPage(){
 const clientReview=true; // review release hard-stops customer submissions
 const [pickupSearch,setPickupSearch]=useState("");const [destinationSearch,setDestinationSearch]=useState("");const [postcodeStatus,setPostcodeStatus]=useState(""),[guestAccess,setGuestAccess]=useState<{jobId:string;reference:string;proof:string}|null>(null),[offers,setOffers]=useState<{id:string;offer_amount_gbp:number;message:string;status:string}[]>([]),[offersMessage,setOffersMessage]=useState(""),[photos,setPhotos]=useState<File[]>([]),[uploadStatus,setUploadStatus]=useState(""),[lookupStatus,setLookupStatus]=useState(""),[estimate,setEstimate]=useState<{available:boolean;estimateGbp?:number;distanceMiles?:number|null;reason?:string;route?:{coordinates:[number,number][];pickup:{latitude:number;longitude:number};destination:{latitude:number;longitude:number}}|null;locations?:{pickup:{latitude:number;longitude:number};destination:{latitude:number;longitude:number}}|null}|null>(null),[estimating,setEstimating]=useState(false),[step,setStep]=useState(0),[v,setV]=useState<Values>(initial),[website,setWebsite]=useState(""),[error,setError]=useState(""),[gps,setGps]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState<{id:string,status:string}|null>(null);
 useEffect(()=>{
  if(step!==4)return;
  const controller=new AbortController();
  setEstimating(true);setEstimate(null);
  if(v.destinationMode!=="transport"){
   setEstimate({available:false,reason:"Price to be confirmed by recovery drivers"});
   setEstimating(false);return ()=>controller.abort();
  }
  const payload={
   pickupPostcode:v.pickupPostcode,destinationPostcode:v.destinationPostcode,
   vehicleType:v.vehicleType,runningStatus:v.runningStatus,
   lockedWheels:v.lockedWheels==="Yes",accident:v.accident==="Yes",
   urgent:v.timing==="urgent",specialEquipment:Boolean(v.equipment),
   loadingDifficulty:Boolean(v.difficulty),
   ...(v.timing==="Scheduled"&&v.preferredCollectionTime?{scheduledAt:new Date(v.preferredCollectionTime).toISOString()}: {})
  };
  fetch("/api/recovery/open-estimate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:controller.signal})
   .then(async r=>{const data=await r.json();if(!r.ok)throw Error("Estimate unavailable");return data;})
   .then(data=>{if(!controller.signal.aborted)setEstimate({available:data.available===true,estimateGbp:data.estimatedPriceGbp,distanceMiles:data.route?.distanceMiles??null,route:data.route??null,locations:data.locations??null,reason:data.message||data.disclaimer||"Price to be confirmed by recovery drivers"});})
   .catch(()=>{if(!controller.signal.aborted)setEstimate({available:false,reason:"Price to be confirmed by recovery drivers"});})
   .finally(()=>{if(!controller.signal.aborted)setEstimating(false);});
  return ()=>controller.abort();
 },[step,v]);
 useEffect(()=>{
  const q=new URLSearchParams(window.location.search);
  const pickupPostcode=q.get("pickup")||"";
  const destinationPostcode=q.get("destination")||"";
  const pickupLocation=q.get("pickupLocation")||"";
  const destinationLocation=q.get("destinationLocation")||"";
  setPickupSearch(pickupLocation||pickupPostcode);
  setDestinationSearch(destinationLocation||destinationPostcode);
  setV(s=>({...s,
    pickupPostcode:pickupPostcode||s.pickupPostcode,
    destinationPostcode:destinationPostcode||s.destinationPostcode,
    pickupAddress:pickupLocation||s.pickupAddress,
    destinationAddress:destinationLocation||s.destinationAddress,
    destinationMode:destinationPostcode||destinationLocation?"transport":s.destinationMode
  }));
 },[]);
 const set=(key:string,value:string)=>setV(s=>({...s,[key]:value}));
 function selectLocation(kind:"pickup"|"destination",item:UkLocationSuggestion){
  if(kind==="pickup"){
   setPickupSearch(item.label);
   setV(s=>({...s,pickupPostcode:item.postcode||"",pickupAddress:item.postcode?s.pickupAddress:item.label}));
  }else{
   setDestinationSearch(item.label);
   setV(s=>({...s,destinationPostcode:item.postcode||"",destinationAddress:item.postcode?s.destinationAddress:item.label}));
  }
  setPostcodeStatus(item.postcode?"Postcode selected. Please confirm the full street address.":"Location selected. Confirm a complete UK postcode and exact street address before continuing.");
 }
 function locationTyped(kind:"pickup"|"destination",text:string){
  if(kind==="pickup"){
   setPickupSearch(text);
   set("pickupPostcode",postcode.test(text.trim())?text.trim():"");
  }else{
   setDestinationSearch(text);
   set("destinationPostcode",postcode.test(text.trim())?text.trim():"");
  }
 }
 const field=(key:string,label:string,required=false,type="text",placeholder="")=><label className="recovery-field"><span>{label}{required?" *":""}</span><input type={type} value={v[key]||""} onChange={e=>set(key,e.target.value)} placeholder={placeholder}/></label>;
 const select=(key:string,label:string,options:string[],required=false)=><label className="recovery-field"><span>{label}{required?" *":""}</span><select value={v[key]||""} onChange={e=>set(key,e.target.value)}><option value="">Select an option</option>{options.map(x=><option key={x}>{x}</option>)}</select></label>;
 const choices=(key:string,options:string[])=><div className="recovery-choices">{options.map(x=><button key={x} type="button" className={v[key]===x?"selected":""} onClick={()=>set(key,x)}>{x}</button>)}</div>;
 const transport=v.destinationMode==="transport";
 async function checkPostcode(value:string,kind:"pickup"|"destination"){
  const which=kind==="pickup"?"Pickup":"Destination";
  if(!postcode.test(value.trim())){
   setPostcodeStatus(which+" postcode has an invalid UK format. Use a complete postcode such as SW1A 1AA.");
   return false;
  }
  try{
   const response=await fetch("/api/recovery/postcode?postcode="+encodeURIComponent(value.trim()),{cache:"no-store"});
   const data=await response.json();
   if(response.status===400||data.valid===false){
    setPostcodeStatus(which+" postcode could not be verified. Check every letter and number, e.g. SW1A 1AA.");
    return false;
   }
   if(!response.ok||data.valid!==true){
    setPostcodeStatus(which+" postcode verification service is temporarily unavailable. You can confirm your exact address manually.");
    return null;
   }
   setPostcodeStatus(which+" postcode confirmed: "+data.postcode+". Please confirm your full street address.");
   return true;
  }catch{
   setPostcodeStatus(which+" postcode lookup is temporarily unavailable. Check your postcode and address manually.");
   return null;
  }
 }
 function validate(i:number){if(i===0){if(!postcode.test(v.pickupPostcode.trim()))return "Enter a valid UK pickup postcode.";if(!v.pickupAddress.trim())return "Confirm the pickup street/address or nearest landmark.";if(transport&&!postcode.test(v.destinationPostcode.trim()))return "Enter a valid UK destination postcode.";}if(i===1){if(!v.make.trim()||!v.model.trim()||!v.vehicleType||!v.transmission||!v.runningStatus)return "Complete the required vehicle information.";if(v.runningStatus==="Non-running"&&(!v.rollingStatus||!v.lockedWheels||!v.damagedWheels))return "Please confirm the vehicle's wheel and rolling condition.";if(!v.accident)return "Confirm whether the vehicle was involved in an accident.";}if(i===2){if(!v.recoveryType||!v.problemDescription.trim())return "Choose a recovery service and describe the problem.";if(v.timing==="Scheduled"&&!v.preferredCollectionTime)return "Choose your preferred collection date and time.";}if(i===3){if(!v.customerName.trim()||!phone.test(v.phone.replace(/[\s-]/g,""))||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))return "Enter your full name, a valid UK mobile number and email.";}return "";}
 async function next(){
  const message=validate(step);
  if(message){setError(message);return;}
  if(step===0){
   setError("");setPostcodeStatus("Checking UK postcodes…");
   const a=await checkPostcode(v.pickupPostcode,"pickup");
   if(a===false){setError("Pickup postcode is invalid or not found. Please correct it.");return;}
   if(transport){
    const d=await checkPostcode(v.destinationPostcode,"destination");
    if(d===false){setError("Destination postcode is invalid or not found. Please correct it.");return;}
   }
  }
  setError("");setStep(s=>Math.min(4,s+1));window.scrollTo(0,0);
 }
 function back(){setError("");setStep(s=>Math.max(0,s-1));}
 function locate(){if(!navigator.geolocation){setGps("GPS unavailable. Enter a postcode manually.");return;}setGps("Finding your location…");navigator.geolocation.getCurrentPosition(async ({coords})=>{try{const response=await fetch("/api/recovery/postcode?lat="+coords.latitude+"&lng="+coords.longitude);const data=await response.json();if(!response.ok)throw new Error();set("pickupPostcode",data.postcode);setPickupSearch(data.postcode);setGps("Nearest postcode found: "+data.postcode+". Please confirm your exact pickup address.");}catch{setGps("GPS postcode lookup unavailable. Enter postcode manually.");}},()=>setGps("Location permission unavailable. Enter postcode manually."));}
 async function submit(){setError("");setBusy(true);try{const res=await fetch("/api/recovery/jobs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...v,website,urgent:v.timing==="urgent"})});const result=await res.json();if(!res.ok)throw new Error(result.error||"Request could not be posted.");setDone(result.job);if(result.guestAccess)setGuestAccess(result.guestAccess);if(photos.length&&result.photoUpload){let count=0;for(const photo of photos){if(photo.size>5242880)continue;const form=new FormData();form.set("jobId",result.photoUpload.jobId);form.set("reference",result.photoUpload.reference);form.set("token",result.photoUpload.token);form.set("photo",photo);const response=await fetch("/api/recovery/photos",{method:"POST",body:form});if(response.ok)count++;}setUploadStatus(count+" of "+photos.length+" photos uploaded.");}}catch(e){setError(e instanceof Error?e.message:"Unable to post request.");}finally{setBusy(false);}}
 return <><PublicHeader/><main className="recovery-v2"><div className="recovery-shell">{done?<section className="recovery-card"><h1>Recovery request received</h1><p>Reference: <strong>{done.id}</strong></p><p>Status: {done.status}</p>{uploadStatus&&<p>{uploadStatus}</p>}<p>Recovery companies may send offers for you to compare. No driver has been automatically selected.</p>{guestAccess&&<><button type="button" className="recovery-next" onClick={async()=>{try{const response=await fetch("/api/recovery/guest-offers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(guestAccess)});if(!response.ok)throw new Error();const data=await response.json();setOffers(data.offers||[]);setOffersMessage(data.offers?.length?"Compare offers below.":"No offers yet. Please check again later.");}catch{setOffersMessage("Unable to load offers right now.");}}}>Refresh driver offers</button><p role="status">{offersMessage}</p>{offers.map(offer=><article key={offer.id} className="recovery-estimate"><strong>£{offer.offer_amount_gbp}</strong><p>{offer.message}</p><p>Status: {offer.status}</p>{offer.status==="pending"&&<button type="button" className="recovery-next" onClick={async()=>{const response=await fetch("/api/recovery/accept-offer",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...guestAccess,offerId:offer.id})});setOffersMessage(response.ok?"Offer accepted. Other offers are closed.":"Unable to accept this offer.");}}>Accept this offer</button>}</article>)}</>}</section>:<><div className="recovery-heading"><span>UK RECOVERY · CUSTOMER REQUEST</span><h1>Request vehicle recovery</h1><p>Five simple steps to connect with independent recovery professionals.</p></div><ol className="recovery-progress">{steps.map((name,i)=><li key={name} className={i===step?"current":i<step?"complete":""}><b>{i+1}</b><span>{name}</span></li>)}</ol><section className="recovery-card"><div style={{position:"absolute",left:"-9999px"}} aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div><div className="recovery-step-label">STEP {step+1} OF 5</div>
 {step===0&&<><h2>Where do you need help?</h2><UkLocationSearch label="Pickup location or UK postcode" value={pickupSearch} required onChange={text=>locationTyped("pickup",text)} onSelect={item=>selectLocation("pickup",item)}/>{!postcode.test(v.pickupPostcode.trim())&&field("pickupPostcode","Confirm complete UK pickup postcode",true,"text","e.g. SW1A 1AA")}<button type="button" className="recovery-text-button" onClick={()=>checkPostcode(v.pickupPostcode,"pickup")}>Check pickup postcode</button>{field("pickupAddress","Pickup street/address or landmark (confirm manually)",true)}<button type="button" className="recovery-text-button" onClick={locate}>⌖ Use My Current Location</button>{gps&&<p role="status">{gps}</p>}<h3>Where should we take your vehicle?</h3>{choices("destinationMode",["transport","Nearest Garage","Roadside Assistance Without Transport"])}{transport&&<><UkLocationSearch label="Drop-off location or UK postcode" value={destinationSearch} required onChange={text=>locationTyped("destination",text)} onSelect={item=>selectLocation("destination",item)}/>{!postcode.test(v.destinationPostcode.trim())&&field("destinationPostcode","Confirm complete UK destination postcode",true,"text","e.g. M1 1AA")}<button type="button" className="recovery-text-button" onClick={()=>checkPostcode(v.destinationPostcode,"destination")}>Check destination postcode</button>{field("destinationAddress","Destination street/address or landmark (confirm manually)")}</>}{postcodeStatus&&<p role="status">{postcodeStatus}</p>}{v.destinationMode==="Nearest Garage"&&<p>A garage cannot be selected automatically until a location provider is configured. You can enter a destination postcode instead.</p>}</>}
 {step===1&&<><h2>Tell us about your vehicle</h2>{field("registration","Vehicle registration (optional)",false,"text","AB12 CDE")}<button type="button" className="recovery-text-button" onClick={async()=>{setLookupStatus("Checking registration…");try{const response=await fetch("/api/recovery/vehicle?registration="+encodeURIComponent(v.registration));const data=await response.json();if(!response.ok)throw new Error(data.error||"Lookup unavailable");setV(s=>({...s,make:data.make||s.make,model:data.model||s.model}));setLookupStatus("Vehicle details retrieved. Please verify.");}catch{setLookupStatus("Lookup unavailable. Enter vehicle details manually.");}}}>Look up registration</button><p role="status">{lookupStatus||"You can always enter vehicle details manually."}</p><div className="recovery-grid">{field("make","Vehicle make",true)}{field("model","Vehicle model",true)}{select("vehicleType","Vehicle type",["Car","Van","Motorbike","4x4","Other"],true)}{select("transmission","Transmission",["Automatic","Manual"],true)}</div><h3>Vehicle condition</h3>{select("runningStatus","Is the vehicle running?",["Running","Non-running"],true)}{v.runningStatus==="Non-running"&&<div className="recovery-grid">{select("rollingStatus","Can it roll freely?",["Yes","No","Not sure"],true)}{select("lockedWheels","Locked wheels?",["Yes","No","Not sure"],true)}{select("damagedWheels","Damaged wheels?",["Yes","No","Not sure"],true)}</div>}{select("accident","Involved in an accident?",["Yes","No"],true)}</>}
 {step===2&&<><h2>What recovery service do you need?</h2><div className="recovery-service-grid">{services.map(x=><button key={x} type="button" className={v.recoveryType===x?"selected":""} onClick={()=>set("recoveryType",x)}>{x}</button>)}</div><label className="recovery-field"><span>Describe the problem *</span><textarea value={v.problemDescription} onChange={e=>set("problemDescription",e.target.value)} rows={4} placeholder="What should the recovery driver know?"/></label><h3>When do you need recovery?</h3>{choices("timing",["urgent","Scheduled"])}{v.timing==="Scheduled"&&field("preferredCollectionTime","Preferred collection date/time",true,"datetime-local")}{(v.runningStatus==="Non-running"||v.accident==="Yes"||v.recoveryType==="Accident Recovery")&&<div className="recovery-grid">{field("equipment","Special equipment needed (if known)")}{field("difficulty","Loading or recovery difficulty")}</div>}<label className="recovery-field">Optional photos (maximum 3, 5MB each)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>setPhotos(Array.from(e.target.files||[]).slice(0,3))}/></label></>}
 {step===3&&<><h2>How can drivers contact you?</h2>{field("customerName","Full name",true)}{field("phone","UK mobile number",true,"tel","07...")}{field("email","Email address",true,"email")}{select("contactPreference","Preferred contact method",["Phone","SMS","Email"],true)}<p>Your contact details must remain private from public driver listings.</p></>}
 {step===4&&<><h2>Review your recovery request</h2><div className="recovery-summary">{[["Pickup",v.pickupPostcode+" · "+v.pickupAddress],["Destination",transport?v.destinationPostcode+" · "+v.destinationAddress:v.destinationMode],["Vehicle",[v.make,v.model,v.vehicleType,v.transmission].filter(Boolean).join(" · ")],["Vehicle condition",[v.runningStatus,v.rollingStatus,v.lockedWheels&&"Locked wheels: "+v.lockedWheels,v.damagedWheels&&"Damaged wheels: "+v.damagedWheels].filter(Boolean).join(" · ")],["Service",v.recoveryType],["Timing",v.timing==="Scheduled"?v.preferredCollectionTime:"Urgent"],["Customer",v.customerName+" · "+v.phone+" · "+v.email]].map(([k,val])=><div key={k}><strong>{k}</strong><span>{val}</span></div>)}</div><div className="recovery-estimate"><span>ESTIMATED RECOVERY PRICE</span><strong>{estimating?"Calculating driving-distance estimate…":estimate?.available?`£${estimate.estimateGbp?.toFixed(2)}`:"Price to be confirmed by recovery drivers"}</strong>{estimate?.distanceMiles!=null&&<p>Driving distance: {estimate.distanceMiles.toFixed(2)} road miles (postcode-centre route)</p>}<p>{estimate?.available?"Independent driver offers may differ from this estimate.":estimate?.reason||"Distance and admin pricing rules must be configured before a reliable amount can be calculated."}</p><RecoveryRouteMap route={estimate?.route??null} pickup={estimate?.locations?.pickup??null} destination={estimate?.locations?.destination??null}/></div><p>This is an estimated recovery cost. Independent recovery companies may submit their own prices and arrival times.</p><p>No online customer payment is required here.</p></>}
 {error&&<p className="recovery-error" role="alert">{error}</p>}<div className="recovery-buttons">{step>0&&<button type="button" className="recovery-back" onClick={back}>← Back</button>}{step<4?<button type="button" className="recovery-next" onClick={next}>Continue →</button>:clientReview?<><p role="status" className="recovery-error">Live request submissions and driver offers are not yet available.</p><button type="button" className="recovery-next" disabled>REQUEST SUBMISSION PAUSED</button></>:<button type="button" className="recovery-next" onClick={submit} disabled={busy}>{busy?"Posting…":"POST RECOVERY REQUEST →"}</button>}</div></section><p className="recovery-bottom">One request → driver offers → you choose your recovery professional.</p></>}</div></main></>;
}