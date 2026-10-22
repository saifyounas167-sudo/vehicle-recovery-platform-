"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {createClient,hasBrowserSupabaseConfig} from "@/lib/supabase/client";
type Role="customer"|"driver"|"admin";
export default function AccountNavigation({mobile=false,onNavigate}:{mobile?:boolean,onNavigate?:()=>void}){
 const [role,setRole]=useState<Role|null>(null),[signedIn,setSignedIn]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true;
  // The public header must render even if Preview was built without Auth env.
  if(!hasBrowserSupabaseConfig()){setReady(true);return;}
  const supabase=createClient();
  async function refresh(){
   const {data:{user}}=await supabase.auth.getUser();
   if(!active)return;
   if(!user){setRole(null);setSignedIn(false);setReady(true);return}
   setSignedIn(true);
   const {data}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
   if(!active)return;
   setRole(data?.role==="customer"||data?.role==="driver"||data?.role==="admin"?data.role:null);
   setReady(true);
  }
  void refresh();
  const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{void refresh()});
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 async function switchAccount(){
  if(busy)return;setBusy(true);
  try{
   const {error}=await createClient().auth.signOut({scope:"local"});
   if(error)throw error;
   const destination=role??"customer";
   window.location.assign("/login?role="+destination+"&switch=1");
  }catch{setBusy(false)}
 }
 async function logout(){
  if(busy)return;setBusy(true);
  try{const {error}=await createClient().auth.signOut({scope:"local"});if(error)throw error;setRole(null);setSignedIn(false);onNavigate?.();window.location.replace("/");}
  catch{setBusy(false)}
 }
 if(!ready||!signedIn)return null;
 return <details className={"account-menu "+(mobile?"account-menu-mobile":"")}>
  <summary aria-label="Open account menu">Account <span aria-hidden="true">⌄</span></summary>
  <div className="account-menu-items">
   {role?<Link href={"/"+role} onClick={onNavigate}>My Dashboard</Link>:<Link href="/login?reason=auth" onClick={onNavigate}>Account access pending</Link>}
   <Link href={role?"/"+role:"/login"} onClick={onNavigate}>Account / Profile</Link>
   <button type="button" disabled={busy} onClick={()=>void switchAccount()}>Switch Google Account</button>
   <button type="button" disabled={busy} onClick={()=>void logout()}>{busy?"Logging out…":"Logout"}</button>
  </div>
 </details>;
}
