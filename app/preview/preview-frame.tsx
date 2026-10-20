import Link from "next/link";
import type {ReactNode} from "react";
type Role="customer"|"driver"|"admin";
const links:[Role,string][]=[["customer","Customer Dashboard"],["driver","Driver Dashboard"],["admin","Admin Dashboard"]];
export default function PreviewFrame({role,children}:{role:Role;children:ReactNode}){
 return <div className="pv-app">
  <div className="pv-banner" role="status"><strong>PREVIEW MODE · SAMPLE DATA ONLY</strong><span>Not a live account. All marketplace actions are disabled.</span></div>
  <header className="pv-header"><Link className="pv-logo" href="/preview">◢ UK <strong>Recovery</strong></Link><nav aria-label="Preview dashboards">{links.map(([id,label])=><Link key={id} href={"/preview/"+id} aria-current={role===id?"page":undefined}>{label}</Link>)}</nav><Link className="pv-home" href="/">Home</Link></header>
  <div className="pv-shell">
   <aside className="pv-side"><p>DEMO NAVIGATION</p>{links.map(([id,label])=><Link key={id} href={"/preview/"+id} className={role===id?"pv-active":""}>{label}</Link>)}<span className="pv-side-note">Live account routes remain protected.</span></aside>
   <main className="pv-main">{children}</main>
  </div>
  <footer className="pv-footer">UK Recovery — Public design preview. No customer or driver records are accessed.</footer>
 </div>;
}
