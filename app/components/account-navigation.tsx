"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Role="customer"|"driver"|"admin";
const validRole=(value:unknown):value is Role=>value==="customer"||value==="driver"||value==="admin";

export default function AccountNavigation({mobile=false,onNavigate}:{mobile?:boolean,onNavigate?:()=>void}){
 const [role,setRole]=useState<Role|null>(null);
 const [signedIn,setSignedIn]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true,requestId=0;
  const supabase=createClient();
  async function refresh(){
   const current=++requestId;
   try{
    const {data:{user},error:authError}=await supabase.auth.getUser();
    if(!active||current!==requestId)return;
    if(authError||!user){setRole(null);setSignedIn(false);setReady(true);return;}
    const {data:profile,error:profileError}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
    if(!active||current!==requestId)return;
    // A missing or inaccessible role must never be guessed from browser metadata.
    setRole(!profileError&&validRole(profile?.role)?profile.role:null);
    setSignedIn(true);setReady(true);
   }catch{
    if(!active||current!==requestId)return;
    setRole(null);setSignedIn(false);setReady(true);
   }
  }
  void refresh();
  const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{
   if(!active)return;
   setReady(false);
   void refresh();
  });
  return()=>{active=false;requestId++;subscription.unsubscribe();};
 },[]);

 async function logout(){
  if(busy)return;setBusy(true);
  try{
   const {error}=await createClient().auth.signOut({scope:"local"});
   if(error)throw error;
   setRole(null);setSignedIn(false);onNavigate?.();window.location.replace("/");
  }catch{setBusy(false);}
 }

 if(!ready||!signedIn)return null;
 return <details className={"account-menu "+(mobile?"account-menu-mobile":"")}>
  <summary aria-label="Open account menu">My Account <span aria-hidden="true">⌄</span></summary>
  <div className="account-menu-items">
   {role?<>
    <Link href={"/"+role} onClick={onNavigate}>My Dashboard</Link>
    <Link href={role==="customer"?"/customer/account":"/account"} onClick={onNavigate}>My Profile</Link>
   </>:<p className="account-menu-notice" role="status">Your profile could not be loaded. Log out and sign in again.</p>}
   <button type="button" disabled={busy} onClick={()=>void logout()}>{busy?"Logging out…":"Logout"}</button>
  </div>
 </details>;
}
