import Link from "next/link";
import {requireRole} from "@/lib/auth";
import type {UserRole} from "@/src/types/domain";
export const dynamic="force-dynamic";
const allowed=new Set<UserRole>(["driver","admin"]);
export default async function AccountPage(){
 // Generic account page is role-protected; customers use the existing /customer/account.
 const {profile}=await (async()=>{
  const {getCurrentProfile}=await import("@/lib/auth");
  const result=await getCurrentProfile();
  if(!result.user||!result.profile) {
   const {redirect}=await import("next/navigation");
   redirect("/login?reason=auth");
  }
  return result;
 })();
 if(!profile){const {redirect}=await import("next/navigation");redirect("/login?reason=auth");}
 const role=profile.role;
 if(!allowed.has(role)){
  const {redirect}=await import("next/navigation");
  if(role==="customer")redirect("/customer/account");
  redirect("/403");
 }
 await requireRole(role);
 return <main className="dashboard-shell">
  <header className="dashboard-header"><div className="container dashboard-nav">
   <div><p className="dashboard-kicker">UK Recovery Account</p><h1>My Profile</h1></div>
   <Link href={"/"+role} className="button secondary">Back to Dashboard</Link>
  </div></header>
  <section className="container dashboard-content">
   <div className="dashboard-card">
    <h2>Your account details</h2>
    <dl>
     <dt>Full name</dt><dd>{profile.full_name||"Not provided"}</dd>
     <dt>Email address</dt><dd>{profile.email||"Not provided"}</dd>
     <dt>Account type</dt><dd>{role==="driver"?"Driver":"Administrator"}</dd>
    </dl>
    <p>Profile changes are unavailable during client review. Your role and account access are protected.</p>
   </div>
  </section>
 </main>;
}
