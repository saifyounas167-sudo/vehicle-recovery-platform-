"use client";
import {useState} from "react";
export default function DriverOfferForm({jobId}:{jobId:string}){
 const [price,setPrice]=useState(""),[eta,setEta]=useState(""),[message,setMessage]=useState(""),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 async function send(e:React.FormEvent){e.preventDefault();setBusy(true);setStatus("");try{
 const response=await fetch("/api/driver/offers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jobId,price:Number(price),etaMinutes:Number(eta),message})});
 const result=await response.json();if(!response.ok)throw Error(result.error||"Offer unavailable");setStatus("Offer sent successfully.");
 }catch(e){setStatus(e instanceof Error?e.message:"Offer unavailable");}finally{setBusy(false)}}
 return <form onSubmit={send} className="dashboard-card nested-card"><h3>Send your offer</h3><div className="form-grid"><label>Price (£)<input required type="number" min="1" max="100000" step=".01" value={price} onChange={e=>setPrice(e.target.value)}/></label><label>Estimated arrival (minutes)<input required type="number" min="1" max="1440" value={eta} onChange={e=>setEta(e.target.value)}/></label></div><label>Optional message<textarea maxLength={500} value={message} onChange={e=>setMessage(e.target.value)}/></label><button className="button primary" disabled={busy}>{busy?"Sending…":"Send price + ETA"}</button><p role="status">{status}</p></form>;
}
