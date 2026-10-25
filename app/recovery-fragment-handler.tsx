"use client";
import {useLayoutEffect} from "react";
import {createClient} from "@/lib/supabase/client";

/** Supabase dashboard recovery email may return implicit tokens in #fragment.
 * Fragments never reach a Next.js server route. Strip before any Auth/network work.
 * Never copy tokens into query strings, logs, storage or analytics.
 */
export default function RecoveryFragmentHandler(){
 useLayoutEffect(()=>{
  const raw=window.location.hash;
  if(!raw)return;
  const values=new URLSearchParams(raw.slice(1));
  const hasCredentials=values.has("access_token")||values.has("refresh_token");
  const recovery=values.get("type")==="recovery";
  const hasError=values.has("error")||values.has("error_code");
  if(!hasCredentials&&!hasError)return;
  // Remove tokens immediately, before async work. URL path is trusted same origin.
  window.history.replaceState(window.history.state,"",window.location.pathname+window.location.search);
  if(!recovery&&!hasError)return;
  if(hasError||!hasCredentials){
   window.location.replace("/login?role=customer&reason=expired_link");
   return;
  }
  const access=values.get("access_token"),refresh=values.get("refresh_token");
  if(!access||!refresh){
   window.location.replace("/login?role=customer&reason=expired_link");
   return;
  }
  void (async()=>{
   try{
    const client=createClient();
    const {error:sessionError}=await client.auth.setSession({access_token:access,refresh_token:refresh});
    if(sessionError)throw Error("Invalid recovery session");
    const {data:{user},error:userError}=await client.auth.getUser();
    if(userError||!user)throw Error("Recovery session not verified");
    const {data:profile,error:profileError}=await client.from("profiles").select("role").eq("id",user.id).maybeSingle();
    if(profileError||!profile||!["customer","driver","admin"].includes(profile.role))throw Error("Account role not verified");
    // Role is derived only from the verified account, never the URL fragment.
    window.location.replace("/login?role="+profile.role+"&mode=recovery");
   }catch{
    try{await createClient().auth.signOut({scope:"local"})}catch{}
    window.location.replace("/login?role=customer&reason=expired_link");
   }
  })();
 },[]);
 return null;
}
