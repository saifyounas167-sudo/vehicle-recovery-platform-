import Link from "next/link";
import {requireRole} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
import AccountNavigation from "../components/account-navigation";
import "./admin-dashboard.css";

export const dynamic="force-dynamic";
type Overview={count:number|null;error:boolean};
type PageSection="dashboard"|"users"|"reviews"|"settings";
type NavItem={label:string;href:string;icon:string;section?:PageSection};
const items:NavItem[]=[
 {label:"Dashboard",href:"/admin",icon:"home",section:"dashboard"},
 {label:"Recovery Requests",href:"/admin/jobs",icon:"truck"},
 {label:"Users",href:"/admin?section=users",icon:"users",section:"users"},
 {label:"Drivers",href:"/admin/drivers",icon:"driver"},
 {label:"Subscriptions",href:"/admin/subscriptions",icon:"card"},
 {label:"Reviews",href:"/admin?section=reviews",icon:"star",section:"reviews"},
 {label:"Reports",href:"/admin/disputes",icon:"report"},
 {label:"Settings",href:"/admin?section=settings",icon:"settings",section:"settings"}
];
function Icon({name}:{name:string}){
 const common={fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
 const path:Record<string,string>={
 home:"m3 10 9-7 9 7v10H3z M9 20v-6h6v6",
 truck:"M3 6h11v11H3z M14 10h4l3 3v4h-7z M5 20h2m10 0h2",
 users:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
 driver:"M4 16l2-8h12l2 8 M4 16h16v3H4z M7 19v2 M17 19v2 M4 13h16",
 card:"M3 6h18v12H3z M3 10h18 M7 15h4",
 star:"m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.6 5.8 21l1.2-6.8-5-4.9 6.9-1z",
 report:"M5 3h14v18H5z M9 8h6 M9 12h6 M9 16h4",
 settings:"M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M18.4 5.6l-2.1 2.1 M7.7 16.3l-2.1 2.1 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6"
 };
 return <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" {...common}><path d={path[name]||path.home}/></svg>;
}
function NavLinks({selected}:{selected:PageSection}){
 return <nav aria-label="Admin dashboard navigation" className="ss11-links">{items.map(item=>
  <Link key={item.label} href={item.href} aria-current={item.section===selected?"page":undefined} className={item.section===selected?"ss11-selected":""}>
   <Icon name={item.icon}/><span>{item.label}</span>
  </Link>)}</nav>;
}
function Stat({label,value,sub,icon,unavailable=false}:{label:string;value:string;sub:string;icon:string;unavailable?:boolean}){
 return <div className="ss11-stat"><span className="ss11-stat-icon"><Icon name={icon}/></span><div className="ss11-stat-copy"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>{unavailable&&<span className="ss11-status-dot" title="Information unavailable" aria-label="Information unavailable"/>}</div>;
}
const label=(result:Overview)=>result.error?"Unavailable":"Live database";
const value=(result:Overview)=>result.error||result.count===null?"—":result.count.toLocaleString("en-GB");
export default async function AdminPage({searchParams}:{searchParams:Promise<{section?:string}>}){
 await requireRole("admin");
 const params=await searchParams;
 const section:PageSection=params.section==="users"||params.section==="reviews"||params.section==="settings"?params.section:"dashboard";
 // Authenticated user's RLS client: no service-role key or unauthorised admin bypass.
 let requests:Overview={count:null,error:true};
 let active:Overview={count:null,error:true};
 let pending:Overview={count:null,error:true};
 if(section==="dashboard"){
  const db=await createClient();
  const [r,a,p]=await Promise.all([
   db.from("recovery_jobs").select("id",{count:"exact",head:true}),
   db.from("driver_profiles").select("id",{count:"exact",head:true}).eq("approval_status","approved").eq("availability","available"),
   db.from("driver_profiles").select("id",{count:"exact",head:true}).eq("approval_status","pending")
  ]);
  requests={count:r.count,error:!!r.error||r.count===null};
  active={count:a.count,error:!!a.error||a.count===null};
  pending={count:p.count,error:!!p.error||p.count===null};
 }
 return <main className="ss11-shell">
  <header className="ss11-topbar"><div className="ss11-topbar-inner">
   <Link href="/" className="ss11-brand" aria-label="UK Recovery home"><span aria-hidden="true">◢</span> UK <b>Recovery</b></Link>
   <span className="ss11-admin-badge">Admin</span>
   <AccountNavigation/>
  </div></header>
  <div className="ss11-layout">
   <aside className="ss11-sidebar"><NavLinks selected={section}/><div className="ss11-sidebar-foot"><span>MANAGEMENT TOOLS</span><Link href="/admin/pricing">Pricing Rules →</Link><Link href="/admin/drivers">Driver Approvals →</Link></div></aside>
   <div className="ss11-main">
    <details className="ss11-mobile-menu"><summary>☰ &nbsp; Admin menu</summary><NavLinks selected={section}/><div className="ss11-mobile-tools"><Link href="/admin/pricing">Pricing Rules</Link> · <Link href="/admin/drivers">Driver Approvals</Link></div></details>
    {section==="dashboard"?<>
     <div className="ss11-heading"><span>PLATFORM OPERATIONS</span><h1>Overview</h1><p>Real marketplace information. No example data or estimated revenue.</p></div>
     <section className="ss11-stats" aria-label="Admin overview">
      <Stat label="Total Requests" value={value(requests)} sub={label(requests)} icon="truck" unavailable={requests.error}/>
      <Stat label="Active Drivers" value={value(active)} sub={active.error?"Unavailable":"Approved & online"} icon="driver" unavailable={active.error}/>
      <Stat label="Pending Drivers" value={value(pending)} sub={label(pending)} icon="users" unavailable={pending.error}/>
      <Stat label="Subscription Revenue" value="—" sub="Stripe revenue not connected" icon="card" unavailable/>
     </section>
     <p className="ss11-note">Revenue is intentionally unavailable until a verified billing source is connected. Approval decisions and pricing changes remain paused in Production.</p>
    </>:<section className="ss11-unsupported" aria-live="polite">
      <h1>{section==="users"?"Users":section==="reviews"?"Reviews":"Settings"}</h1>
      <p>{section==="users"?"User-management records are not connected to this admin screen yet.":section==="reviews"?"Verified review management is not connected yet.":"Admin-specific settings are not available in client review mode."}</p>
      {section==="settings"&&<Link href="/settings">View existing app preferences →</Link>}
     </section>}
   </div>
  </div>
 </main>;
}
