"use client";
import {useState} from "react";
export default function AcceptOffer({offerId}:{offerId:string}){
 const [status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 async function accept(){if(!window.confirm("Accept this driver's offer? Other offers will close."))return;setBusy(true);try{const response=await fetch("/api/customer/accept-offer",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({offerId})});const data=await response.json();if(!response.ok)throw Error(data.error||"Offer unavailable");setStatus("Driver selected. Other offers closed.");window.location.reload()}catch(e){setStatus(e instanceof Error?e.message:"Unable to accept offer");}finally{setBusy(false)}}
 return <div><button className="button primary" disabled={busy} onClick={accept}>{busy?"Processing…":"Accept this driver"}</button><p role="status">{status}</p></div>;
}
