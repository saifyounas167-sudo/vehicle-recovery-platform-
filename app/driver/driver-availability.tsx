"use client";
import {useState} from "react";
export default function DriverAvailability({initial,approved}:{initial:string;approved:boolean}){
 const [value,setValue]=useState(initial),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function change(next:string){setBusy(true);setMessage("");try{const response=await fetch("/api/driver/availability",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({availability:next})});const body=await response.json();if(!response.ok)throw Error(body.error||"Unable to change status");setValue(next);setMessage("Availability updated. Refresh the job feed to see current eligible jobs.");}catch(e){setMessage(e instanceof Error?e.message:"Unable to change status");}finally{setBusy(false)}}
 return <div className="dashboard-card"><h2>Your availability</h2><label>Driver status<select value={value} disabled={busy||!approved} onChange={e=>void change(e.target.value)}><option value="offline">Offline</option><option value="available">Available</option><option value="busy">Busy</option></select></label><p role="status">{message||(!approved?"Verification approval is required before going Available.":"Only available, verified eligible drivers are matched to nearby jobs.")}</p></div>;
}
