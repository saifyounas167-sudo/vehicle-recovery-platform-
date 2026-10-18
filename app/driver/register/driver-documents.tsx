"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
type Doc={id:string;type:string;uploadedAt:string};
const labels:Record<string,string>={insurance:"Insurance",driving_licence:"Driving Licence",business:"Business Registration",other:"Other Verification"};
export default function DriverDocuments({readOnly=false}:{readOnly?:boolean}){
 const [kind,setKind]=useState("insurance"),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [docs,setDocs]=useState<Doc[]>([]),[loading,setLoading]=useState(true);
 const refresh=useCallback(async()=>{
  try{
   const r=await fetch("/api/driver/documents",{cache:"no-store"});
   const j=await r.json();
   if(!r.ok)throw Error(j.error||"Documents temporarily unavailable");
   setDocs(j.documents||[]);
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to load documents")}
  finally{setLoading(false)}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 async function upload(event:FormEvent){
  event.preventDefault();if(!file||busy||readOnly)return;
  if(file.size>5242880){setMessage("Upload a document under 5MB");return;}
  setBusy(true);setMessage("");
  try{
   const data=new FormData();data.set("documentType",kind);data.set("file",file);
   const r=await fetch("/api/driver/documents",{method:"POST",body:data}),j=await r.json();
   if(!r.ok)throw Error(j.error||"Upload unavailable");
   setFile(null);setMessage("Document uploaded privately for admin review.");
   await refresh();
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to upload")}
  finally{setBusy(false)}
 }
 async function view(id:string){
  setMessage("");
  try{
   const r=await fetch("/api/driver/documents?documentId="+encodeURIComponent(id),{cache:"no-store"});
   const j=await r.json();
   if(!r.ok||typeof j.url!=="string")throw Error(j.error||"Document unavailable");
   const u=new URL(j.url);
   if(u.protocol!=="https:")throw Error("Invalid private document link");
   window.open(u.href,"_blank","noopener,noreferrer");
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to view document")}
 }
 return <section className="ss8-docs" aria-labelledby="ss8-docs-title">
  <h2 id="ss8-docs-title">Private verification documents</h2>
  <p className="form-help">Insurance and driving licence are required. If you registered a company, upload business documents too. Only you and authorised administrators can access these documents.</p>
  {loading?<p role="status">Checking your documents…</p>:
   docs.length?<ul className="ss8-docs-list">{docs.map(d=><li key={d.id}><span>{labels[d.type]||"Verification document"} <small>{new Date(d.uploadedAt).toLocaleDateString("en-GB")}</small></span><button type="button" className="button secondary" onClick={()=>void view(d.id)}>View securely</button></li>)}</ul>:
   <p>No verification documents have been uploaded yet.</p>}
  {!readOnly&&<form className="ss8-form" onSubmit={upload}>
   <label>Document type<select value={kind} onChange={e=>setKind(e.target.value)}><option value="insurance">Insurance</option><option value="driving_licence">Driving licence</option><option value="business">Business registration</option><option value="other">Other verification document</option></select></label>
   <label>Private document (PDF, JPG, PNG; max 5 MB)<input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
   <button type="submit" className="ss8-primary" disabled={busy||!file}>{busy?"Uploading…":"Upload securely"}</button>
  </form>}
  <p role="status" className="ss8-status">{message}</p>
 </section>;
}
