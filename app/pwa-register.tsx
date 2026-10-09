"use client";
import {useEffect} from "react";
export function PwaRegister(){
 useEffect(()=>{
  if(!("serviceWorker" in navigator))return;
  // Deliberately network-only: no cached HTML, API responses or private data.
  const register=()=>{navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>{});};
  if(document.readyState==="complete")register();
  else window.addEventListener("load",register,{once:true});
  return()=>window.removeEventListener("load",register);
 },[]);
 return null;
}
