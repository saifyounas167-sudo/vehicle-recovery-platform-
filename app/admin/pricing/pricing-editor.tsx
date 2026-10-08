"use client";
import {useState} from "react";
import {pricingKeys,type PricingConfig} from "@/src/lib/recovery-pricing";
export default function PricingEditor({id,initial}:{id:string;initial:PricingConfig}){
 const [values,setValues]=useState<Record<string,string>>(Object.fromEntries(pricingKeys.map(k=>[k,String(initial[k])]))),[status,setStatus]=useState(""),[saving,setSaving]=useState(false);
 async function save(e:React.FormEvent){e.preventDefault();setSaving(true);setStatus("");try{
 const ruleConfig=Object.fromEntries(pricingKeys.map(k=>[k,Number(values[k])]));
 const res=await fetch("/api/admin/pricing",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,ruleConfig})});const data=await res.json();if(!res.ok)throw Error(data.error||"Unable to save");setStatus("Pricing saved successfully.");
 }catch(e){setStatus(e instanceof Error?e.message:"Unable to save");}finally{setSaving(false)}}
 return <form onSubmit={save} className="dashboard-card"><h2>Admin-controlled recovery rates (£)</h2><p>Enter approved rates only. No default or invented amounts are used.</p><div className="form-grid">{pricingKeys.map(key=><label key={key}>{key.replace(/([A-Z])/g," $1")}<input type="number" required min="0" max="100000" step="0.01" value={values[key]} onChange={e=>setValues(s=>({...s,[key]:e.target.value}))}/></label>)}</div><button className="button primary" disabled={saving}>{saving?"Saving…":"Save pricing rules"}</button><p role="status">{status}</p></form>;
}
