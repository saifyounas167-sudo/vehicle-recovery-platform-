import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentProfile} from "@/lib/auth";
export const dynamic="force-dynamic";
export default async function AccountPage(){
 const {user,profile}=await getCurrentProfile();
 if(!user||!profile)redirect("/login?reason=auth");
 if(profile.role==="customer")redirect("/customer/account");
 if(profile.role!=="driver"&&profile.role!=="admin")redirect("/403");
 const role=profile.role;
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
