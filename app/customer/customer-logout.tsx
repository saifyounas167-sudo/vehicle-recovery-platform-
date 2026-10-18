"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
import CustomerIcon from "./customer-icons";
export default function CustomerLogout(){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function logOut(){
  if(busy)return;setBusy(true);setError("");
  try{
   const {error}=await createClient().auth.signOut({scope:"local"});
   if(error)throw error;
   window.location.replace("/");
  }catch{
   setError("Unable to sign out. Please try again.");
   setBusy(false);
  }
 }
 return <div className="customer-logout-wrap"><button type="button" className="customer-logout" onClick={()=>void logOut()} disabled={busy}><CustomerIcon name="logout"/><span>{busy?"Signing out…":"Logout"}</span></button>{error&&<p role="alert" className="customer-logout-error">{error}</p>}</div>;
}
