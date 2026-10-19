"use client";
import {useEffect,useState} from "react";
import PublicHeader from "../../components/public-header";
import {ukDate,ukTime,ukTimeLabel,ukSlotInstant,ukAvailableSlots} from "../../../src/lib/uk-schedule";
import {recoveryServices,getServiceRules,isRecoveryService,requiresDestination,validateRecoveryDetails,resetAnswersForService} from "../../../src/lib/recovery-service-rules";
import {recoveryPhotosError} from "../../../src/lib/recovery-photo-rules";
import EstimateResult from "../../components/estimate-result";
import CustomerDriverOffers from "../../components/customer-driver-offers";
import UkLocationSearch, {type UkLocationSuggestion} from "../../components/uk-location-search";

const steps=["Location","Vehicle","Recovery","Customer","Review"];
const demoStages=["Details","Estimate","Offers","Choose"] as const;
const services=recoveryServices;
const postcode=/^(GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}))$/i;
const phone=/^(?:\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}$/;
type Values=Record<string,string>;
const initial:Values={pickupPostcode:"",destinationPostcode:"",destinationMode:"",pickupAddress:"",destinationAddress:"",registration:"",make:"",model:"",vehicleType:"",transmission:"",runningStatus:"",rollingStatus:"",passengerCount:"",lockedWheels:"",damagedWheels:"",accident:"",recoveryType:"",problemDescription:"",timing:"urgent",preferredCollectionTime:"",equipment:"",difficulty:"",customerName:"",phone:"",email:"",contactPreference:"Phone"};
export default function RecoveryRequestPage(){
 const [clientReview,setClientReview]=useState(true); // Fail closed until the server attests isolated staging.
 useEffect(()=>{let mounted=true;fetch("/api/client-review-status",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(mounted&&d.isolatedStaging===true&&d.writesEnabled===true)setClientReview(false);}).catch(()=>{});return()=>{mounted=false};},[]);
 const [estimateAttempt,setEstimateAttempt]=useState(0);
 const [scheduleDate,setScheduleDate]=useState("");
 const [scheduleTime,setScheduleTime]=useState("");
 const [detailOpen,setDetailOpen]=useState<"vehicle"|"issue"|"contact"|null>(null);
 const [pickupOpen,setPickupOpen]=useState(true);
 const [dropoffOpen,setDropoffOpen]=useState(false);
 const [showPickupAddressEdit,setShowPickupAddressEdit]=useState(false);
 const [showDestinationAddressEdit,setShowDestinationAddressEdit]=useState(false);
const [pickupSearch,setPickupSearch]=useState("");const [destinationSearch,setDestinationSearch]=useState("");const [postcodeStatus,setPostcodeStatus]=useState(""),[guestAccess,setGuestAccess]=useState<{jobId:string;reference:string;proof:string}|null>(null),[offers,setOffers]=useState<{id:string;offer_amount_gbp:number;message:string;status:string}[]>([]),[offersMessage,setOffersMessage]=useState(""),[photos,setPhotos]=useState<File[]>([]),[uploadStatus,setUploadStatus]=useState(""),[lookupStatus,setLookupStatus]=useState(""),[estimate,setEstimate]=useState<{available:boolean;estimateGbp?:number;distanceMiles?:number|null;reason?:string;route?:{coordinates:[number,number][];pickup:{latitude:number;longitude:number};destination:{latitude:number;longitude:number}}|null;locations?:{pickup:{latitude:number;longitude:number};destination:{latitude:number;longitude:number}}|null}|null>(null),[estimating,setEstimating]=useState(false),[step,setStep]=useState(0),[v,setV]=useState<Values>(initial),[website,setWebsite]=useState(""),[error,setError]=useState(""),[gps,setGps]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState<{id:string,status:string}|null>(null);
 useEffect(()=>{
  if(step!==4)return;
  const controller=new AbortController();
  setEstimating(true);setEstimate(null);
  if(!transport||!postcode.test(v.destinationPostcode.trim())){
   setEstimate({available:false,reason:"Price to be confirmed by recovery drivers"});
   setEstimating(false);return ()=>controller.abort();
  }
  const payload={
   recoveryType:v.recoveryType,destinationMode:v.destinationMode,pickupPostcode:v.pickupPostcode,destinationPostcode:v.destinationPostcode,
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
 },[step,v,estimateAttempt]);
 useEffect(()=>{
  const q=new URLSearchParams(window.location.search);
  const selected=q.get("service");
  const pickupRaw=q.get("pickup")||"";
  const pickupPostcode=postcode.test(pickupRaw.trim())?pickupRaw.trim().toUpperCase():"";
  const destinationRaw=q.get("destination")||"";
  const destinationPostcode=postcode.test(destinationRaw.trim())?destinationRaw.trim().toUpperCase():"";
  const pickupLocation=q.get("pickupLocation")||"";
  const destinationLocation=q.get("destinationLocation")||"";
  setPickupSearch((pickupLocation||pickupRaw).slice(0,250));
  setDestinationSearch((destinationLocation||destinationRaw).slice(0,250));
  setV(s=>({...s,
    pickupPostcode:pickupPostcode||s.pickupPostcode,
    destinationPostcode:destinationPostcode||s.destinationPostcode,
    pickupAddress:pickupPostcode&&pickupLocation&&!postcode.test(pickupLocation.trim())?pickupLocation.slice(0,250):"",
    destinationAddress:destinationPostcode&&destinationLocation&&!postcode.test(destinationLocation.trim())?destinationLocation.slice(0,250):"",
    recoveryType:isRecoveryService(selected)?selected:s.recoveryType,
    destinationMode:isRecoveryService(selected)?getServiceRules(selected)?.destination==="required"?"transport":getServiceRules(selected)?.destination==="none"?"Roadside Assistance Without Transport":"":s.destinationMode
  }));
 },[]);
 const [draftHydrated,setDraftHydrated]=useState(false);
 const draftKeys=["vehicleType","transmission","runningStatus","rollingStatus","passengerCount","lockedWheels","damagedWheels","accident","recoveryType","timing"] as const;
 useEffect(()=>{
  // Restore only non-identifying choices. Never persist contact, street address, registration or notes.
  try{
   const raw=sessionStorage.getItem("ukr-request-safe-draft-v1");
   if(raw){const saved=JSON.parse(raw) as Record<string,unknown>;setV(current=>{
    const next={...current};
    for(const key of draftKeys)if(typeof saved[key]==="string"&&saved[key].length<120&&(key!=="recoveryType"||!new URLSearchParams(window.location.search).has("service")))next[key]=saved[key] as string;
    // Restore a safe mode for each persisted service; never restore stale loading
    // answers for roadside services, nor an old Breakdown transport choice.
    const restored=getServiceRules(next.recoveryType);
    next.destinationMode=restored?.destination==="required"?"transport":
      restored?.destination==="none"?"Roadside Assistance Without Transport":"";
    if(!requiresDestination(next.recoveryType,next.destinationMode)){
      for(const key of ["runningStatus","rollingStatus","passengerCount","lockedWheels","damagedWheels"])next[key]="";
    }
    if(!restored?.accident)next.accident="";
    if(!restored?.passengers)next.passengerCount="";
    return next;
   });}
  }catch{}
  setDraftHydrated(true);
  window.history.replaceState({...window.history.state,ukrWizardStep:0},"");
  const handlePop= (event:PopStateEvent)=>{
   const newStep=event.state?.ukrWizardStep;
   if(typeof newStep==="number"&&Number.isInteger(newStep)&&(newStep===0||newStep===4)){setStep(newStep);setError("");}
  };
  window.addEventListener("popstate",handlePop);
  return ()=>window.removeEventListener("popstate",handlePop);
 },[]);
 useEffect(()=>{
  // This storage excludes exact locations and all personal information.
  if(!draftHydrated)return;
  try{
   const safe:Record<string,string>={};
   for(const key of draftKeys)safe[key]=v[key]||"";
   sessionStorage.setItem("ukr-request-safe-draft-v1",JSON.stringify(safe));
  }catch{}
 },[v,draftHydrated]);
 function navigateStep(nextStep:number){
  const target=nextStep===4?4:0;
  window.history.pushState({...window.history.state,ukrWizardStep:target},"");
  setStep(target);setError("");
 }
 const set=(key:string,value:string)=>{setV(old=>({
  ...old,[key]:value,
  ...(key==="timing"&&value==="urgent"?{preferredCollectionTime:""}:{}),
  ...(key==="rollingStatus"&&value!=="No"?{lockedWheels:"",damagedWheels:"",equipment:"",difficulty:""}:{})
 }));setError("");};
 function selectBreakdownMode(mode:string){
  if(mode!=="transport"&&mode!=="Roadside Assistance Without Transport")return;
  setV(old=>({...old,destinationMode:mode,
   ...(mode==="transport"?{}:{destinationPostcode:"",destinationAddress:"",
    runningStatus:"",rollingStatus:"",lockedWheels:"",damagedWheels:"",
    passengerCount:"",equipment:"",difficulty:""})}));
  if(mode!=="transport"){setDestinationSearch("");setDropoffOpen(false);}
  setError("");setPostcodeStatus("");
 }
 function selectPhotos(files:FileList|null){
  const chosen=Array.from(files||[]);
  const warning=recoveryPhotosError(chosen);
  if(warning){setPhotos([]);setError(warning);return;}
  setPhotos(chosen);setError("");
 }
 function selectLocation(kind:"pickup"|"destination",item:UkLocationSuggestion){
  if(kind==="pickup"){
   setPickupSearch(item.label);
   if(item.postcode&&(item.kind==="building"||item.kind==="amenity"))setPickupOpen(false);
   setV(s=>({...s,pickupPostcode:item.postcode||"",pickupAddress:item.kind==="building"||item.kind==="amenity"?item.label:""}));
  }else{
   setDestinationSearch(item.label);
   if(item.postcode&&(item.kind==="building"||item.kind==="amenity"))setDropoffOpen(false);
   setV(s=>({...s,destinationPostcode:item.postcode||"",destinationAddress:item.kind==="building"||item.kind==="amenity"?item.label:""}));
  }
  setError("");setPostcodeStatus(item.postcode?"Postcode selected. Choose a precise address if listed, or add an address/landmark manually.":"Location selected. Enter the full postcode and address or landmark.");
 }
 function locationTyped(kind:"pickup"|"destination",text:string){
  setError("");
  if(kind==="pickup"){
   setPickupSearch(text);
   setV(s=>({...s,pickupPostcode:postcode.test(text.trim())?text.trim().toUpperCase():"",pickupAddress:""}));
  }else{
   setDestinationSearch(text);
   setV(s=>({...s,destinationPostcode:postcode.test(text.trim())?text.trim().toUpperCase():"",destinationAddress:""}));
  }
 }
 const field=(key:string,label:string,required=false,type="text",placeholder="")=><label className="recovery-field"><span>{label}{required?" *":""}</span><input type={type} value={v[key]||""} onChange={e=>set(key,e.target.value)} placeholder={placeholder}/></label>;
 const select=(key:string,label:string,options:string[],required=false)=><label className="recovery-field"><span>{label}{required?" *":""}</span><select value={v[key]||""} onChange={e=>set(key,e.target.value)}><option value="">Select an option</option>{options.map(x=><option key={x}>{x}</option>)}</select></label>;
 const choices=(key:string,options:string[])=><div className="recovery-choices">{options.map(x=><button key={x} type="button" className={v[key]===x?"selected":""} onClick={()=>set(key,x)}>{x}</button>)}</div>;
 const rule=getServiceRules(v.recoveryType);
 const transport=requiresDestination(v.recoveryType,v.destinationMode);
 const scheduledDate=v.preferredCollectionTime?ukDate(new Date(v.preferredCollectionTime)):"";
 const scheduledTime=v.preferredCollectionTime?ukTime(new Date(v.preferredCollectionTime)):"";
 const dateChoice=scheduleDate||scheduledDate;
 const today=ukDate(new Date());
 const slotChoices=ukAvailableSlots(dateChoice||scheduledDate);
 const loading=!!rule&&(rule.destination==="required"||(rule.destination==="choice"&&v.destinationMode==="transport"));
 function selectService(service:string){
  if(!isRecoveryService(service))return;
  // Reflect the non-sensitive service selection in the URL for correct refresh and history.
  window.history.replaceState({...window.history.state},"",`/recovery/request?service=${encodeURIComponent(service)}`);
  if(service===v.recoveryType)return;
  const nextRules=getServiceRules(service);
  const keepDestination=transport&&nextRules?.destination==="required";
  setV(old=>resetAnswersForService(old,service));
  if(!keepDestination){setDestinationSearch("");setDropoffOpen(false);}
  setPhotos([]);setPostcodeStatus("");setError("");
 }
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
 function validate(){return validateRecoveryDetails(v);}

 async function next(){
  const message=validate();
  if(message){
   const section=/name|mobile|email/i.test(message)?"contact":/service|roadside|transport\.$|Scheduled|ASAP|date and time/i.test(message)?"issue":/vehicle|running|roll|passenger|accident/i.test(message)?"vehicle":null;
   setDetailOpen(section);if(/pickup/i.test(message))setPickupOpen(true);if(/destination|drop-off/i.test(message))setDropoffOpen(true);setError(message);
   requestAnimationFrame(()=>document.querySelector('[role="alert"]')?.scrollIntoView({block:"center",behavior:"smooth"}));
   return;
  }
  setError("");setPostcodeStatus("Checking UK postcodes…");
  const pickupCheck=await checkPostcode(v.pickupPostcode,"pickup");
  if(pickupCheck===false){setPickupOpen(true);setError("Pickup postcode is invalid or not found. Please correct it.");return;}
  if(transport&&v.destinationPostcode){const destinationCheck=await checkPostcode(v.destinationPostcode,"destination");if(destinationCheck===false){setDropoffOpen(true);setError("Destination postcode is invalid or not found. Please correct it.");return;}}
  // A lookup outage is not a rejection: retain the manually confirmed postcode/address.
  if(pickupCheck===null)setPostcodeStatus("Postcode service unavailable. Your manually entered pickup address will be used for this demo preview.");
  navigateStep(4);window.scrollTo(0,0);
 }
 function back(){navigateStep(0);}
 function locate(){if(!navigator.geolocation){setGps("GPS unavailable. Enter a postcode manually.");return;}setGps("Finding your location…");navigator.geolocation.getCurrentPosition(async ({coords})=>{try{const response=await fetch("/api/recovery/postcode?lat="+coords.latitude+"&lng="+coords.longitude);const data=await response.json();if(!response.ok)throw new Error();setV(s=>({...s,pickupPostcode:data.postcode,pickupAddress:""}));setPickupSearch(data.postcode);setGps("Nearest postcode found: "+data.postcode+". Please confirm your exact pickup address.");}catch{setGps("GPS postcode lookup unavailable. Enter postcode manually.");}},()=>setGps("Location permission unavailable. Enter postcode manually."));}
 async function submit(){setError("");setBusy(true);try{const res=await fetch("/api/recovery/jobs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...v,website,urgent:v.timing==="urgent"})});const result=await res.json();if(!res.ok)throw new Error(result.error||"Request could not be posted.");setDone(result.job);if(result.guestAccess)setGuestAccess(result.guestAccess);if(photos.length&&result.photoUpload){let count=0;for(const photo of photos){if(photo.size>5242880)continue;const form=new FormData();form.set("jobId",result.photoUpload.jobId);form.set("reference",result.photoUpload.reference);form.set("token",result.photoUpload.token);form.set("photo",photo);const response=await fetch("/api/recovery/photos",{method:"POST",body:form});if(response.ok)count++;}setUploadStatus(count+" of "+photos.length+" photos uploaded.");}}catch(e){setError(e instanceof Error?e.message:"Unable to post request.");}finally{setBusy(false);}}
 return <><PublicHeader/><main className="recovery-v2"><div className="recovery-shell">{done?<section className="recovery-card">{guestAccess?<><CustomerDriverOffers access={guestAccess}/><p className="uk-offers-receipt" role="status">Request submitted · Reference {done.id} · No driver has been automatically selected.</p>{uploadStatus&&<p>{uploadStatus}</p>}</>:<><h1>Recovery request received</h1><p>Reference: <strong>{done.id}</strong></p><p>Status: {done.status}</p><p>Driver offers will be available when your request is accessible.</p>{uploadStatus&&<p>{uploadStatus}</p>}</>}</section>:<>{step===0&&<div className="recovery-heading"><span>UK RECOVERY · CUSTOMER REQUEST</span><h1>Request Recovery</h1><p>Enter your details to explore an estimate and compare independent driver offers when the marketplace launches.</p></div>}<ol className="recovery-progress recovery-demo-progress" aria-label="Client recovery journey">{demoStages.map((name,i)=><li key={name} className={i===(step===4?1:0)?"current":i<(step===4?1:0)?"complete":""}><b>{i+1}</b><span>{name}</span></li>)}</ol>{step===0&&<p className="recovery-detail-progress" role="status">Enter pickup, drop-off (if needed), vehicle, issue and contact details</p>}<section className="recovery-card"><div style={{position:"absolute",left:"-9999px"}} aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>{step===0&&<div className="recovery-step-label">DETAILS · REQUEST RECOVERY</div>}
 {step===0&&<>
 <div className="recovery-client-locations">
 <div className="recovery-demo-collapsible recovery-location-card">
  <button type="button" className="recovery-demo-toggle" aria-expanded={pickupOpen} aria-controls="demo-pickup-fields" onClick={()=>setPickupOpen(open=>!open)}><span aria-hidden="true">⌖</span><span>Pickup Location<small>{v.pickupPostcode?(v.pickupAddress?v.pickupPostcode+" · "+v.pickupAddress:v.pickupPostcode):"Enter postcode or use my location"}</small></span><span aria-hidden="true">{pickupOpen?"−":"⌄"}</span></button>
  {pickupOpen&&<div id="demo-pickup-fields" className="recovery-demo-fields">
   <UkLocationSearch label="Pickup Location" value={pickupSearch} required onChange={text=>locationTyped("pickup",text)} onSelect={item=>selectLocation("pickup",item)}/>
   {Boolean(pickupSearch.trim())&&!postcode.test(v.pickupPostcode.trim())&&field("pickupPostcode","Confirm complete UK pickup postcode",true,"text","e.g. SW1A 1AA")}
   {v.pickupAddress.trim()&&!showPickupAddressEdit?<div className="recovery-address-summary"><span>Address: {v.pickupAddress}</span><button type="button" onClick={()=>setShowPickupAddressEdit(true)}>Edit address</button></div>:pickupSearch.trim()||v.pickupPostcode?field("pickupAddress","Pickup address or nearest landmark",true):<p className="recovery-help">Enter a pickup postcode or search for an address to begin.</p>}
   <button type="button" className="recovery-text-button" onClick={locate}>⌖ Use My Current Location</button>
   {gps&&<p role="status">{gps}</p>}
   {postcodeStatus&&<p role="status">{postcodeStatus}</p>}
   <p className="recovery-help">If address suggestions are unavailable, enter the postcode and nearest address or landmark manually.</p>
  </div>}
 </div>
 {<div className="recovery-demo-collapsible recovery-location-card">
  <button type="button" className="recovery-demo-toggle" aria-expanded={dropoffOpen} aria-controls="demo-dropoff-fields" onClick={()=>setDropoffOpen(open=>!open)}><span aria-hidden="true">◎</span><span>Drop-off Location {transport?"(Required)":"(Optional)"}<small>{v.destinationPostcode?(v.destinationAddress?v.destinationPostcode+" · "+v.destinationAddress:v.destinationPostcode):transport?"Enter delivery postcode or address":"Add destination if needed"}</small></span><span aria-hidden="true">{dropoffOpen?"−":"⌄"}</span></button>
  {dropoffOpen&&<div id="demo-dropoff-fields" className="recovery-demo-fields">
   {!transport&&<p className="recovery-help">A destination is not required for roadside assistance.</p>}
   <UkLocationSearch label="Drop-off Location" value={destinationSearch} required={transport} onChange={text=>locationTyped("destination",text)} onSelect={item=>selectLocation("destination",item)}/>
   {Boolean(destinationSearch.trim())&&!postcode.test(v.destinationPostcode.trim())&&field("destinationPostcode","Confirm UK destination postcode",transport,"text","e.g. M1 1AA")}
   {v.destinationAddress.trim()&&!showDestinationAddressEdit?<div className="recovery-address-summary"><span>Destination: {v.destinationAddress}</span><button type="button" onClick={()=>setShowDestinationAddressEdit(true)}>Edit address</button></div>:(destinationSearch.trim()||v.destinationPostcode)&&field("destinationAddress","Drop-off address or nearest landmark (optional)")}
   {postcodeStatus&&<p role="status">{postcodeStatus}</p>}
   <p className="recovery-help">Enter postcode and an address or landmark manually if autocomplete is unavailable.</p>
  </div>}
 </div>}
 </div>
 <div className="recovery-demo-collapsible"><button type="button" className="recovery-demo-toggle" aria-expanded={detailOpen==="issue"} aria-controls="demo-issue-fields" onClick={()=>{setDetailOpen(detailOpen==="issue"?null:"issue");setError("");}}><span aria-hidden="true">⚒</span><span>What&apos;s the issue?<small>Select service and recovery timing</small></span><span aria-hidden="true">{detailOpen==="issue"?"−":"⌄"}</span></button>{detailOpen==="issue"&&<div id="demo-issue-fields" className="recovery-demo-fields"><h2>What recovery service do you need?</h2>
  <div className="recovery-service-grid" role="group" aria-label="Choose one recovery service">
   {services.map(service=><button key={service} type="button" className={v.recoveryType===service?"selected":""} aria-pressed={v.recoveryType===service} onClick={()=>selectService(service)}>{service}</button>)}
  </div>
  {rule?.destination==="choice"&&<div className="recovery-field"><span>Do you need roadside assistance or vehicle transport? *</span><div className="recovery-choices">{[["Roadside Assistance Without Transport","Roadside assistance"],["transport","Vehicle transport"]].map(([mode,label])=><button key={mode} type="button" aria-pressed={v.destinationMode===mode} className={v.destinationMode===mode?"selected":""} onClick={()=>selectBreakdownMode(mode)}>{label}</button>)}</div></div>}
  <h3>When do you need recovery?</h3>
  <div className="recovery-choices"><button type="button" aria-pressed={v.timing==="urgent"} className={v.timing==="urgent"?"selected":""} onClick={()=>{set("timing","urgent");setScheduleDate("");setScheduleTime("");}}>ASAP</button><button type="button" aria-pressed={v.timing==="Scheduled"} className={v.timing==="Scheduled"?"selected":""} onClick={()=>set("timing","Scheduled")}>Scheduled</button></div>
  {v.timing==="Scheduled"&&<div className="recovery-grid recovery-schedule-grid">
   <label className="recovery-field"><span>Select Date *</span><input aria-label="Select Date" type="date" min={today} value={dateChoice} onChange={e=>{const day=e.target.value;setScheduleDate(day);setScheduleTime("");set("preferredCollectionTime","");}}/></label>
   <label className="recovery-field"><span>Select Time (UK local time) *</span><select aria-label="Select Time" value={scheduleTime||scheduledTime} onChange={e=>{const time=e.target.value;setScheduleTime(time);set("preferredCollectionTime",ukSlotInstant(dateChoice,time)||"");}} disabled={!dateChoice}><option value="">Select a time</option>{slotChoices.map(time=><option key={time} value={time}>{ukTimeLabel(time)}</option>)}</select></label>
   {dateChoice&&slotChoices.length===0&&<p className="recovery-help">No future slots on this date. Select another date.</p>}
  </div>}
  <label className="recovery-field"><span>Additional Details (Optional)</span><textarea value={v.problemDescription} maxLength={3000} onChange={e=>set("problemDescription",e.target.value)} rows={3} placeholder="Anything else the driver should know?"/></label>{loading&&(v.rollingStatus==="No"||v.accident==="Yes")&&<div className="recovery-grid">{field("equipment","Special equipment needed (optional)")}{field("difficulty","Loading difficulty (optional)")}</div>}<label className="recovery-field">Optional photos (maximum 3, 5MB each)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{selectPhotos(e.currentTarget.files);if(recoveryPhotosError(Array.from(e.currentTarget.files||[])))e.currentTarget.value="";}}/></label>{photos.length>0&&<p className="recovery-help" role="status">{photos.length} photo{photos.length===1?"":"s"} selected</p>}</div>}</div>
 <div className="recovery-demo-collapsible"><button type="button" className="recovery-demo-toggle" aria-expanded={detailOpen==="vehicle"} aria-controls="demo-vehicle-fields" onClick={()=>{setDetailOpen(detailOpen==="vehicle"?null:"vehicle");setError("");}}><span aria-hidden="true">🚗</span><span>Vehicle Details<small>Select make, model and type</small></span><span aria-hidden="true">{detailOpen==="vehicle"?"−":"⌄"}</span></button>{detailOpen==="vehicle"&&<div id="demo-vehicle-fields" className="recovery-demo-fields"><h2>Tell us about your vehicle</h2>{field("registration","Vehicle registration (optional)",false,"text","AB12 CDE")}<button type="button" className="recovery-text-button" onClick={async()=>{setLookupStatus("Checking registration…");try{const response=await fetch("/api/recovery/vehicle?registration="+encodeURIComponent(v.registration));const data=await response.json();if(!response.ok)throw new Error(data.error||"Lookup unavailable");setV(s=>({...s,make:data.make||s.make,model:data.model||s.model}));setLookupStatus("Vehicle details retrieved. Please verify.");}catch{setLookupStatus("Lookup unavailable. Enter vehicle details manually.");}}}>Look up registration</button><p role="status">{lookupStatus||"You can always enter vehicle details manually."}</p><div className="recovery-grid">{field("make","Vehicle make (optional)")}{field("model","Vehicle model (optional)")}{select("vehicleType","Vehicle type",["Car","Van","Motorbike","4x4","Other"],true)}{select("transmission","Transmission (optional)",["Automatic","Manual"])}</div>{loading&&<><h3>Vehicle condition</h3>{select("runningStatus","Is the vehicle running?",["Running","Non-running"],true)}<div className="recovery-grid">{select("rollingStatus","Can the vehicle roll for loading?",["Yes","No","Not Sure"],true)}{rule?.passengers&&select("passengerCount","How many passengers will need to travel?",["0","1","2","3","4","5","6","7","8"],true)}</div>{rule?.passengers&&<p className="recovery-help">Passenger capacity must be confirmed by your recovery driver.</p>}{v.rollingStatus==="No"&&<div className="recovery-grid">{select("lockedWheels","Locked wheels? (optional)",["Yes","No","Not sure"])}{select("damagedWheels","Damaged wheels? (optional)",["Yes","No","Not sure"])}</div>}</>}{rule?.accident&&select("accident","Involved in an accident?",["Yes","No"],true)}</div>}</div>
 <div className="recovery-demo-collapsible"><button type="button" className="recovery-demo-toggle" aria-expanded={detailOpen==="contact"} aria-controls="demo-contact-fields" onClick={()=>{setDetailOpen(detailOpen==="contact"?null:"contact");setError("");}}><span aria-hidden="true">☎</span><span>Your Contact Details<small>Shared privately with your selected provider</small></span><span aria-hidden="true">{detailOpen==="contact"?"−":"⌄"}</span></button>{detailOpen==="contact"&&<div id="demo-contact-fields" className="recovery-demo-fields"><h2>How can drivers contact you?</h2>{field("customerName","Full name",true)}{field("phone","UK mobile number",true,"tel","07...")}{field("email","Email address (optional)",false,"email")}{select("contactPreference","Preferred contact method",["Phone","SMS","Email"],false)}<p>Your contact details must remain private from public driver listings.</p></div>}</div>
 </>}
 {step===4&&<EstimateResult estimate={estimate} estimating={estimating} vehicle={[v.make,v.model,v.vehicleType].filter(Boolean).join(" · ")} service={v.recoveryType} needsDestination={transport} canSubmit={!clientReview} submitting={busy} onSubmit={submit} onEdit={back} onRetry={()=>{setEstimateAttempt(n=>n+1);window.scrollTo({top:0,behavior:"smooth"});}}/>}
 {error&&<p className="recovery-error" role="alert">{error}</p>}{step===0&&<div className="recovery-buttons"><button type="button" className="recovery-next" onClick={next}>Get Estimate →</button></div>}</section><p className="recovery-bottom">One request → driver offers → you choose your recovery professional.</p></>}</div></main></>;
}