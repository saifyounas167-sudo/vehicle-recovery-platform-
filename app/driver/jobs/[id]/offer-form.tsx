"use client";
import {useState} from "react";
export default function DriverOfferForm({jobId}:{jobId:string}){
 const [amount,setAmount]=useState(""),[eta,setEta]=useState(""),[message,setMessage]=useState(""),[status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setStatus("");try{
  const response=await fetch("/api/driver/offers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jobId,amount:Number(amount),etaMinutes:Number(eta),message})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||"Offer could not be submitted");
  setStatus("Your price and ETA offer has been submitted.");
 }catch(e){setStatus(e instanceof Error?e.message:"Offer unavailable");}finally{setBusy(false);}}
 return <form onSubmit={submit} className="dashboard-card nested-card"><h3>Send a recovery offer</h3><div className="form-grid"><label>Price (£)<input type="number" min="1" max="100000" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Estimated arrival (minutes)<input type="number" min="1" max="1440" required value={eta} onChange={e=>setEta(e.target.value)}/></label></div><label>Optional message<textarea maxLength={500} value={message} onChange={e=>setMessage(e.target.value)}/></label><button type="submit" className="button primary" disabled={busy}>{busy?"Sending…":"Send price + ETA offer"}</button><p role="status">{status}</p></form>;
}
