"use client";
import {useState,type FormEvent} from "react";
export default function DriverDocuments(){
 const [kind,setKind]=useState("insurance"),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function upload(event:FormEvent){event.preventDefault();if(!file||busy)return;setBusy(true);setMessage("");try{
  const data=new FormData();data.set("documentType",kind);data.set("file",file);
  const r=await fetch("/api/driver/documents",{method:"POST",body:data}),j=await r.json();
  if(!r.ok)throw Error(j.error||"Upload unavailable");
  setFile(null);setMessage("Private document uploaded for admin verification.");
 }catch(e){setMessage(e instanceof Error?e.message:"Unable to upload");}finally{setBusy(false)}}
 return <form className="form-grid" onSubmit={upload}><h2>Upload verification documents</h2><p className="form-help">Upload valid insurance and identity documents securely. Admin must personally review them before approval. Documents are not shown on public profiles.</p><label>Document type<select value={kind} onChange={e=>setKind(e.target.value)}><option value="insurance">Insurance</option><option value="driving_licence">Driving licence</option><option value="business">Business registration</option><option value="other">Other verification document</option></select></label><label>Private file (PDF, JPG or PNG, maximum 5MB)<input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button type="submit" className="button secondary" disabled={busy||!file}>{busy?"Uploading securely…":"Upload private document"}</button><p role="status">{message}</p></form>;
}
