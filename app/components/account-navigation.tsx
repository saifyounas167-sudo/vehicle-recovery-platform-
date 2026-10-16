"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";
type Role="customer"|"driver"|"admin";
export default function AccountNavigation({mobile=false,onNavigate}:{mobile?:boolean,onNavigate?:()=>void}){
 const [role,setRole]=useState<Role|null>(null),[signedIn,setSignedIn]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true;
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
 async function logout(){
  if(busy)return;setBusy(true);
  try{const {error}=await createClient().auth.signOut({scope:"local"});if(error)throw error;setRole(null);setSignedIn(false);onNavigate?.();window.location.replace("/");}
  catch{setBusy(false)}
 }
 if(!ready)return <span className="account-auth-loading" aria-label="Checking account session"/>;
 if(signedIn)return <span className={mobile?"account-nav-mobile":"account-nav-desktop"}>
   {role?<Link href={"/"+role} onClick={onNavigate}>My Dashboard</Link>:<Link href="/login?reason=auth" onClick={onNavigate}>Account access pending</Link>}
   <button type="button" disabled={busy} onClick={()=>void logout()}>{busy?"Logging out…":"Logout"}</button>
 </span>;
 return <span className={mobile?"account-nav-mobile":"account-nav-desktop"}>
   <Link href="/login?role=customer" onClick={onNavigate}>Customer Login</Link>
   <Link href="/login?role=driver" onClick={onNavigate}>Business Login</Link>
   <Link href="/login?role=driver" onClick={onNavigate}>Driver Login</Link>
   <Link href="/login?role=admin" onClick={onNavigate}>Admin Login</Link>
 </span>;
}
