import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {requireRole} from "@/lib/auth";
import CustomerFrame from "../customer-frame";
import CustomerIcon from "../customer-icons";
export const dynamic="force-dynamic";
export default async function CustomerAccountPage(){
 const {user}=await requireRole("customer");
 const supabase=await createClient();
 const {data:profile,error}=await supabase.from("profiles")
  .select("full_name,email,phone,created_at").eq("id",user.id).maybeSingle();
 return <CustomerFrame active="account">
  <section className="customer-welcome customer-welcome-compact"><div>
   <span className="customer-eyebrow">MY ACCOUNT</span>
   <h1>My Profile & Settings</h1>
   <p>Review your UK Recovery account details.</p>
  </div><Link className="customer-outline-button" href="/customer">← Back to Dashboard</Link></section>
  <section className="customer-dashboard-section">
   <div className="customer-section-heading"><div><span className="customer-section-kicker">ACCOUNT DETAILS</span><h2>Your profile</h2></div></div>
   <div className="customer-panel customer-profile-panel">
    <span className="customer-soft-icon"><CustomerIcon name="account" size={26}/></span>
    {error||!profile?<p role="status">Profile information is temporarily unavailable. Please try again later.</p>:
    <dl className="customer-profile-list">
     <div><dt>Full name</dt><dd>{profile.full_name||"Not provided"}</dd></div>
     <div><dt>Email address</dt><dd>{profile.email||"Not provided"}</dd></div>
     <div><dt>UK phone number</dt><dd>{profile.phone||"Not added"}</dd></div>
     <div><dt>Account access</dt><dd>Customer</dd></div>
    </dl>}
   </div>
  </section>
  <section className="customer-dashboard-section"><div className="customer-panel customer-account-help">
   <CustomerIcon name="shield" size={24}/>
   <div><h2>Secure account settings</h2><p>Profile editing is not available during the current client review. Your sign-in, password recovery and logout remain available through the existing account system.</p>
   <Link href="/login?role=customer&mode=forgot" className="customer-text-link">Password reset <CustomerIcon name="arrow" size={16}/></Link></div>
  </div></section>
  <footer className="customer-app-footer">UK RECOVERY <span>Your account information is visible only to you.</span></footer>
 </CustomerFrame>;
}
