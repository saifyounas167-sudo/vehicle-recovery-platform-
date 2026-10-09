"use client";
import Link from "next/link";
import {FormEvent,useState} from "react";
import PublicHeader from "../../components/public-header";
import RecoveryRouteMap from "../../components/recovery-route-map";
import "./nearby.css";

type Point={latitude:number;longitude:number};
const ukPostcode=/^(GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}))$/i;
export default function NearbyRecoveryPage(){
 const [input,setInput]=useState(""),[postcode,setPostcode]=useState(""),[point,setPoint]=useState<Point|null>(null);
 const [status,setStatus]=useState("Enter a UK postcode or use GPS to explore the search area."),[loading,setLoading]=useState(false);
 async function resolve(value:string){
  const cleaned=value.trim().toUpperCase();
  if(!ukPostcode.test(cleaned)){setStatus("Enter a complete valid UK postcode, such as SW1A 1AA.");setPoint(null);return;}
  setLoading(true);setStatus("Checking postcode…");setPoint(null);
  try{
   const res=await fetch("/api/recovery/postcode?postcode="+encodeURIComponent(cleaned),{cache:"no-store"});
   const data=await res.json();
   if(!res.ok||data.valid!==true||!Number.isFinite(data.latitude)||!Number.isFinite(data.longitude)){
    setStatus(data.valid===false?"Postcode not found. Check the postcode and try again.":"Postcode lookup unavailable. Please try again later.");return;
   }
   setPostcode(data.postcode);setInput(data.postcode);
   setPoint({latitude:data.latitude,longitude:data.longitude});
   setStatus("Map centred on "+data.postcode+". The pin is an approximate postcode centre, not a recovery company location.");
  }catch{setStatus("Location service unavailable. Enter a postcode and try again.");}
  finally{setLoading(false);}
 }
 async function submit(e:FormEvent){e.preventDefault();await resolve(input);}
 function locate(){
  if(!navigator.geolocation){setStatus("GPS is unavailable; enter a UK postcode.");return;}
  setLoading(true);setStatus("Finding a nearby UK postcode…");
  navigator.geolocation.getCurrentPosition(async({coords})=>{
   try{
    const res=await fetch("/api/recovery/postcode?lat="+coords.latitude+"&lng="+coords.longitude,{cache:"no-store"});
    const data=await res.json();if(!res.ok||!data.postcode)throw Error();
    await resolve(data.postcode);
   }catch{setStatus("Could not find a nearby UK postcode. Please enter one manually.");setLoading(false);}
  },()=>{setStatus("Location permission denied or unavailable. Enter your postcode manually.");setLoading(false);},{timeout:10000});
 }
 const href="/recovery/request"+(postcode?"?pickup="+encodeURIComponent(postcode):"");
 return <><PublicHeader/><main className="nearby-page"><div className="nearby-wrap">
  <Link href="/" className="nearby-back">← Back to homepage</Link>
  <span className="nearby-kicker">UK RECOVERY · CLIENT DEMO</span>
  <h1>Find Recovery <em>Near Me</em></h1>
  <p className="nearby-lead">Search a UK postcode to explore an area. This is a discovery preview, not direct driver booking or real-time availability.</p>
  <form className="nearby-form" onSubmit={submit}>
   <label htmlFor="nearby-postcode">Your UK postcode</label>
   <div className="nearby-input-row"><input id="nearby-postcode" autoComplete="postal-code" placeholder="e.g. SW1A 1AA" value={input} onChange={e=>setInput(e.target.value)} disabled={loading} required/><button type="submit" disabled={loading}>Search Area</button></div>
   <button type="button" className="nearby-gps" onClick={locate} disabled={loading}>⌖ Use My Current Location</button>
  </form>
  <p className="nearby-status" role="status" aria-live="polite">{status}</p>
  {point&&<div className="nearby-map"><RecoveryRouteMap route={null} pickup={point}/></div>}
  <section className="nearby-results" aria-labelledby="nearby-results-title"><h2 id="nearby-results-title">Recovery Companies</h2>
   <div className="nearby-empty"><b>Verified company listings are not available in this demo yet.</b><p>Our existing database does not currently provide a secure public coverage-location directory for approved recovery companies. We will not show unverified, fictional or private driver locations. A searched postcode pin represents the search area only.</p><p>When company discovery is ready, approved businesses may receive requests and send independent price and ETA offers. The customer will still choose the preferred driver.</p><Link className="nearby-request" href={href}>Explore Recovery Request →</Link><small>Read-only demo: no live booking, offer submission or payment.</small></div>
  </section>
 </div></main></>;
}
