"use client";
import {useEffect,useState} from "react";
const allowed=new Set(["/","/how-it-works","/about"]);
export default function PreviewLinkGuard(){
 const [notice,setNotice]=useState("");
 useEffect(()=>{
  function intercept(event:MouseEvent){
   const anchor=(event.target as Element|null)?.closest?.("a[href]");
   if(!anchor)return;
   const href=anchor.getAttribute("href");
   if(!href||href.startsWith("#")||href.startsWith("mailto:")||href.startsWith("tel:"))return;
   try{
    const url=new URL(href,window.location.href);
    if(url.origin!==window.location.origin)return;
    if(allowed.has(url.pathname))return;
    event.preventDefault();event.stopPropagation();
    setNotice("This feature is still under development and is not available in the client design preview.");
   }catch{}
  }
  document.addEventListener("click",intercept,true);
  return()=>document.removeEventListener("click",intercept,true);
 },[]);
 return <>{notice&&<div role="status" className="client-preview-notice"><span>{notice}</span><button type="button" onClick={()=>setNotice("")} aria-label="Dismiss preview notice">×</button></div>}</>;
}
